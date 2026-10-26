import db from '../db';
import { saveBase64File } from '../utils/fileStorage';

export const testSeriesService = {
  // ==========================================
  // SUPER ADMIN: CATEGORIES MANAGEMENT
  // ==========================================
  getCategories: async () => {
    const [rows]: any = await db.query('SELECT * FROM test_categories ORDER BY display_order ASC, id DESC');
    return rows;
  },

  createCategory: async (data: any) => {
    const { name, slug, description, icon, display_order } = data;
    let thumbUrl = data.thumbnail_url;
    if (thumbUrl && thumbUrl.startsWith('data:image/')) {
      thumbUrl = saveBase64File(thumbUrl, `test-cat-${Date.now()}`, 'test-categories');
    }
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const [result]: any = await db.query(`
      INSERT INTO test_categories (name, slug, description, thumbnail_url, icon, display_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, finalSlug, description || '', thumbUrl || null, icon || 'BookOpen', display_order || 0]);
    return { id: result.insertId, ...data, thumbnail_url: thumbUrl, slug: finalSlug };
  },

  updateCategory: async (id: number | string, data: any) => {
    const { name, slug, description, icon, display_order, status } = data;
    let thumbUrl = data.thumbnail_url;
    if (thumbUrl && thumbUrl.startsWith('data:image/')) {
      thumbUrl = saveBase64File(thumbUrl, `test-cat-${Date.now()}`, 'test-categories');
    }
    await db.query(`
      UPDATE test_categories
      SET name = COALESCE(?, name),
          slug = COALESCE(?, slug),
          description = COALESCE(?, description),
          thumbnail_url = CASE WHEN ? IS NOT NULL THEN ? ELSE thumbnail_url END,
          icon = COALESCE(?, icon),
          display_order = COALESCE(?, display_order),
          status = COALESCE(?, status)
      WHERE id = ?
    `, [name, slug, description, thumbUrl !== undefined ? thumbUrl : null, thumbUrl, icon, display_order, status, id]);
    return { id, ...data, thumbnail_url: thumbUrl };
  },

  deleteCategory: async (id: number | string) => {
    await db.query('DELETE FROM test_categories WHERE id = ?', [id]);
    return { success: true };
  },

  // ==========================================
  // SUPER ADMIN & STUDENT: SUB-CATEGORIES
  // ==========================================
  getSubCategories: async (categoryId?: number | string) => {
    let query = `
      SELECT sc.*, c.name as category_name 
      FROM test_sub_categories sc
      JOIN test_categories c ON sc.category_id = c.id
    `;
    const params: any[] = [];
    if (categoryId && categoryId !== 'ALL' && Number(categoryId) > 0) {
      query += ` WHERE sc.category_id = ?`;
      params.push(Number(categoryId));
    }
    query += ` ORDER BY sc.display_order ASC, sc.id ASC`;
    const [rows]: any = await db.query(query, params);
    return rows;
  },

  createSubCategory: async (data: any) => {
    const { category_id, name, slug, description, display_order, status } = data;
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const [result]: any = await db.query(`
      INSERT INTO test_sub_categories (category_id, name, slug, description, display_order, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [category_id, name, finalSlug, description || '', display_order || 0, status || 'ACTIVE']);
    return { id: result.insertId, ...data, slug: finalSlug };
  },

  updateSubCategory: async (id: number | string, data: any) => {
    const { category_id, name, slug, description, display_order, status } = data;
    await db.query(`
      UPDATE test_sub_categories
      SET category_id = COALESCE(?, category_id),
          name = COALESCE(?, name),
          slug = COALESCE(?, slug),
          description = COALESCE(?, description),
          display_order = COALESCE(?, display_order),
          status = COALESCE(?, status)
      WHERE id = ?
    `, [category_id, name, slug, description, display_order, status, id]);
    return { id, ...data };
  },

  deleteSubCategory: async (id: number | string) => {
    await db.query('DELETE FROM test_sub_categories WHERE id = ?', [id]);
    return { success: true };
  },

  // ==========================================
  // SUPER ADMIN: PAYMENT QR CONFIGURATION
  // ==========================================
  getPaymentQRs: async () => {
    const [rows]: any = await db.query('SELECT * FROM test_payment_qr ORDER BY is_global_default DESC, id DESC');
    return rows;
  },

  createPaymentQR: async (data: any) => {
    let qrUrl = data.qr_image_url;
    if (qrUrl && qrUrl.startsWith('data:image/')) {
      qrUrl = saveBase64File(qrUrl, `test-qr-${Date.now()}`, 'payment-qr');
    }
    if (!qrUrl && data.upi_id) {
      let upiData = `upi://pay?pa=${encodeURIComponent(data.upi_id)}&pn=${encodeURIComponent(data.account_name || 'Examirror')}&cu=INR`;
      if (data.amount && Number(data.amount) > 0) {
        upiData += `&am=${encodeURIComponent(Number(data.amount).toFixed(2))}`;
      }
      qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiData)}`;
    }
    if (data.is_global_default) {
      await db.query('UPDATE test_payment_qr SET is_global_default = FALSE');
    }
    const [result]: any = await db.query(`
      INSERT INTO test_payment_qr (title, upi_id, account_name, qr_image_url, amount, instructions, is_global_default, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.title,
      data.upi_id,
      data.account_name,
      qrUrl || '',
      data.amount !== undefined && data.amount !== '' ? Number(data.amount) : 0.00,
      data.instructions || '',
      data.is_global_default ? 1 : 0,
      data.status || 'ACTIVE'
    ]);
    return { id: result.insertId, ...data, qr_image_url: qrUrl };
  },

  updatePaymentQR: async (id: number | string, data: any) => {
    let qrUrl = data.qr_image_url;
    if (qrUrl && qrUrl.startsWith('data:image/')) {
      qrUrl = saveBase64File(qrUrl, `test-qr-${Date.now()}`, 'payment-qr');
    }
    if (data.is_global_default) {
      await db.query('UPDATE test_payment_qr SET is_global_default = FALSE WHERE id != ?', [id]);
    }
    await db.query(`
      UPDATE test_payment_qr
      SET title = COALESCE(?, title),
          upi_id = COALESCE(?, upi_id),
          account_name = COALESCE(?, account_name),
          qr_image_url = COALESCE(?, qr_image_url),
          amount = COALESCE(?, amount),
          instructions = COALESCE(?, instructions),
          is_global_default = COALESCE(?, is_global_default),
          status = COALESCE(?, status)
      WHERE id = ?
    `, [
      data.title,
      data.upi_id,
      data.account_name,
      qrUrl,
      data.amount !== undefined && data.amount !== '' ? Number(data.amount) : null,
      data.instructions,
      data.is_global_default !== undefined ? (data.is_global_default ? 1 : 0) : null,
      data.status,
      id
    ]);
    return { id, ...data };
  },

  deletePaymentQR: async (id: number | string) => {
    await db.query('DELETE FROM test_payment_qr WHERE id = ?', [id]);
    return { success: true };
  },

  // ==========================================
  // SUPER ADMIN: AUTO-PUBLISH SCHEDULER & SERIES
  // ==========================================
  autoPublishScheduled: async () => {
    try {
      const [result]: any = await db.query(`
        UPDATE test_series
        SET status = 'PUBLISHED'
        WHERE status = 'SCHEDULED' 
          AND scheduled_publish_time IS NOT NULL 
          AND scheduled_publish_time <= NOW()
      `);
      if (result.affectedRows > 0) {
        console.log(`[Auto-Publisher] Auto-published ${result.affectedRows} scheduled test series.`);
      }
      return result.affectedRows || 0;
    } catch (e) {
      console.error('Error auto-publishing scheduled test series:', e);
      return 0;
    }
  },

  getAllTestSeriesAdmin: async (statusFilter?: string) => {
    // 1. Process any pending scheduled auto-publishes
    await testSeriesService.autoPublishScheduled();

    let query = `
      SELECT 
        ts.*,
        c.name as category_name,
        sc.name as sub_category_name,
        qr.upi_id as qr_upi_id,
        qr.account_name as qr_account_name,
        (SELECT COUNT(*) FROM tests t WHERE t.test_series_id = ts.id) as tests_count,
        (
          CASE 
            WHEN ts.is_free = 1 AND ts.publish_scope = 'ALL_CENTRES' THEN 
              (SELECT COUNT(*) FROM students WHERE status = 'active')
            WHEN ts.is_free = 1 AND ts.publish_scope = 'SELECTED_CENTRES' THEN 
              (SELECT COUNT(*) FROM students s JOIN test_series_centres tsc ON s.centerId = tsc.centre_id WHERE tsc.test_series_id = ts.id AND s.status = 'active')
            ELSE 
              (SELECT COUNT(*) FROM test_series_enrollments tse JOIN students s ON tse.student_id = s.id WHERE tse.test_series_id = ts.id AND tse.status = 'ACTIVE' AND s.status = 'active')
          END
        ) as active_enrollments,
        (SELECT COUNT(*) FROM test_payments tp WHERE tp.test_series_id = ts.id AND tp.status = 'PENDING') as pending_payments
      FROM test_series ts
      LEFT JOIN test_categories c ON ts.category_id = c.id
      LEFT JOIN test_sub_categories sc ON ts.sub_category_id = sc.id
      LEFT JOIN test_payment_qr qr ON ts.payment_qr_id = qr.id
    `;

    const params: any[] = [];
    if (statusFilter && statusFilter !== 'ALL') {
      query += ` WHERE ts.status = ?`;
      params.push(statusFilter);
    }

    query += ` ORDER BY ts.id DESC`;

    const [rows]: any = await db.query(query, params);

    // Fetch allowed centres and assigned categories for each series
    const seriesIds = rows.map((r: any) => r.id);
    let catMap = new Map<number, any[]>();
    if (seriesIds.length > 0) {
      const [allCats]: any = await db.query(`
        SELECT tsc.test_series_id, tsc.category_id, tc.name as category_name
        FROM test_series_categories tsc
        JOIN test_categories tc ON tsc.category_id = tc.id
        WHERE tsc.test_series_id IN (?)
      `, [seriesIds]);

      for (const c of allCats) {
        const sId = Number(c.test_series_id);
        if (!catMap.has(sId)) catMap.set(sId, []);
        catMap.get(sId)!.push({
          id: Number(c.category_id),
          name: c.category_name
        });
      }
    }

    for (const s of rows) {
      const cats = catMap.get(Number(s.id)) || [];
      s.assigned_categories = cats;
      s.category_ids = cats.map(c => c.id);
      if (s.category_id && !s.category_ids.includes(Number(s.category_id))) {
        s.category_ids.push(Number(s.category_id));
      }

      if (s.publish_scope === 'SELECTED_CENTRES') {
        const [centres]: any = await db.query(`
          SELECT centre_id FROM test_series_centres WHERE test_series_id = ?
        `, [s.id]);
        s.allowed_centre_ids = centres.map((c: any) => c.centre_id);
      } else {
        s.allowed_centre_ids = [];
      }
    }

    return rows;
  },

  createTestSeries: async (data: any, adminUserId?: number) => {
    let thumbUrl = data.thumbnail_url;
    if (thumbUrl && thumbUrl.startsWith('data:image/')) {
      thumbUrl = saveBase64File(thumbUrl, `series-thumb-${Date.now()}`, 'test-series');
    }

    const finalSlug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 1000);

    const formatSqlDate = (d: any) => {
      if (!d || d === '' || d === 'null' || d === 'undefined') return null;
      const parsed = new Date(d);
      if (isNaN(parsed.getTime())) return null;
      return parsed.toISOString().slice(0, 19).replace('T', ' ');
    };

    const schedTimeFormatted = formatSqlDate(data.scheduled_publish_time);
    const startDateFormatted = formatSqlDate(data.start_date);
    const endDateFormatted = formatSqlDate(data.end_date);

    let initialStatus = data.status || 'DRAFT';
    let scheduledTime = data.scheduled_publish_time ? new Date(data.scheduled_publish_time) : null;

    // Check if scheduled publish time is already in the past
    if (initialStatus === 'SCHEDULED' && scheduledTime && !isNaN(scheduledTime.getTime()) && scheduledTime.getTime() <= Date.now()) {
      initialStatus = 'PUBLISHED';
    }

    const [result]: any = await db.query(`
      INSERT INTO test_series (
        title, slug, category_id, sub_category_id, description, thumbnail_url, instructions,
        exam_type, language, difficulty, total_tests, price, is_free,
        duration_minutes, validity_days, publish_scope, payment_qr_id,
        start_date, end_date, scheduled_publish_time, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.title,
      finalSlug,
      data.category_id && Number(data.category_id) > 0 ? Number(data.category_id) : null,
      data.sub_category_id && Number(data.sub_category_id) > 0 ? Number(data.sub_category_id) : null,
      data.description || '',
      thumbUrl || '',
      data.instructions || '',
      data.exam_type || 'Mock Test Series',
      data.language || 'English + Hindi',
      data.difficulty || 'ALL_LEVELS',
      data.total_tests || 1,
      data.is_free ? 0.00 : (Number(data.price) || 0.00),
      data.is_free ? 1 : 0,
      data.duration_minutes || 60,
      data.validity_days || 90,
      data.publish_scope || 'ALL_CENTRES',
      data.payment_qr_id && Number(data.payment_qr_id) > 0 ? Number(data.payment_qr_id) : null,
      startDateFormatted,
      endDateFormatted,
      schedTimeFormatted,
      initialStatus
    ]);

    const seriesId = result.insertId;

    // Save multi-category assignments in test_series_categories
    const allCatIds = new Set<number>();
    if (data.category_id && Number(data.category_id) > 0) {
      allCatIds.add(Number(data.category_id));
    }
    if (Array.isArray(data.category_ids)) {
      data.category_ids.forEach((cId: any) => {
        if (Number(cId) > 0) allCatIds.add(Number(cId));
      });
    }
    for (const cId of allCatIds) {
      const subCat = (cId === Number(data.category_id)) ? (data.sub_category_id ? Number(data.sub_category_id) : null) : null;
      await db.query(`
        INSERT IGNORE INTO test_series_categories (test_series_id, category_id, sub_category_id)
        VALUES (?, ?, ?)
      `, [seriesId, cId, subCat]);
    }

    // Save allowed centres if scope is SELECTED_CENTRES
    if (data.publish_scope === 'SELECTED_CENTRES' && Array.isArray(data.allowed_centre_ids)) {
      for (const centreId of data.allowed_centre_ids) {
        await db.query(`
          INSERT IGNORE INTO test_series_centres (test_series_id, centre_id)
          VALUES (?, ?)
        `, [seriesId, centreId]);
      }
    }

    // Audit Log
    await db.query(`
      INSERT INTO test_audit_logs (user_id, user_role, action, entity_type, entity_id, details)
      VALUES (?, 'SUPER_ADMIN', 'CREATE_TEST_SERIES', 'TEST_SERIES', ?, ?)
    `, [adminUserId || null, seriesId, JSON.stringify({ title: data.title, status: initialStatus, scheduled_publish_time: schedTimeFormatted })]);

    return { id: seriesId, ...data, slug: finalSlug, status: initialStatus, thumbnail_url: thumbUrl };
  },

  updateTestSeries: async (id: number | string, data: any, adminUserId?: number) => {
    let thumbUrl = data.thumbnail_url;
    if (thumbUrl && thumbUrl.startsWith('data:image/')) {
      thumbUrl = saveBase64File(thumbUrl, `series-thumb-${Date.now()}`, 'test-series');
    }

    const formatSqlDate = (d: any) => {
      if (!d || d === '' || d === 'null' || d === 'undefined') return null;
      const parsed = new Date(d);
      if (isNaN(parsed.getTime())) return null;
      return parsed.toISOString().slice(0, 19).replace('T', ' ');
    };

    const schedTimeFormatted = formatSqlDate(data.scheduled_publish_time);
    const startDateFormatted = formatSqlDate(data.start_date);
    const endDateFormatted = formatSqlDate(data.end_date);

    let targetStatus = data.status;
    let scheduledTime = data.scheduled_publish_time ? new Date(data.scheduled_publish_time) : null;

    if (targetStatus === 'SCHEDULED' && scheduledTime && !isNaN(scheduledTime.getTime()) && scheduledTime.getTime() <= Date.now()) {
      targetStatus = 'PUBLISHED';
    }

    await db.query(`
      UPDATE test_series
      SET title = COALESCE(?, title),
          slug = COALESCE(?, slug),
          category_id = COALESCE(?, category_id),
          sub_category_id = ?,
          description = COALESCE(?, description),
          thumbnail_url = COALESCE(?, thumbnail_url),
          instructions = COALESCE(?, instructions),
          exam_type = COALESCE(?, exam_type),
          language = COALESCE(?, language),
          difficulty = COALESCE(?, difficulty),
          total_tests = COALESCE(?, total_tests),
          price = COALESCE(?, price),
          is_free = COALESCE(?, is_free),
          duration_minutes = COALESCE(?, duration_minutes),
          validity_days = COALESCE(?, validity_days),
          publish_scope = COALESCE(?, publish_scope),
          payment_qr_id = ?,
          start_date = ?,
          end_date = ?,
          scheduled_publish_time = ?,
          status = COALESCE(?, status)
      WHERE id = ?
    `, [
      data.title,
      data.slug,
      data.category_id && Number(data.category_id) > 0 ? Number(data.category_id) : null,
      data.sub_category_id && Number(data.sub_category_id) > 0 ? Number(data.sub_category_id) : null,
      data.description,
      thumbUrl,
      data.instructions,
      data.exam_type,
      data.language,
      data.difficulty,
      data.total_tests,
      data.is_free ? 0.00 : data.price,
      data.is_free !== undefined ? (data.is_free ? 1 : 0) : null,
      data.duration_minutes,
      data.validity_days,
      data.publish_scope,
      data.payment_qr_id && Number(data.payment_qr_id) > 0 ? Number(data.payment_qr_id) : null,
      startDateFormatted,
      endDateFormatted,
      schedTimeFormatted,
      targetStatus,
      id
    ]);

    // Update multi-category assignments if provided
    if (Array.isArray(data.category_ids) || data.category_id !== undefined) {
      const allCatIds = new Set<number>();
      if (data.category_id && Number(data.category_id) > 0) {
        allCatIds.add(Number(data.category_id));
      }
      if (Array.isArray(data.category_ids)) {
        data.category_ids.forEach((cId: any) => {
          if (Number(cId) > 0) allCatIds.add(Number(cId));
        });
      }
      if (allCatIds.size > 0) {
        await db.query('DELETE FROM test_series_categories WHERE test_series_id = ?', [id]);
        for (const cId of allCatIds) {
          const subCat = (cId === Number(data.category_id)) ? (data.sub_category_id ? Number(data.sub_category_id) : null) : null;
          await db.query(`
            INSERT IGNORE INTO test_series_categories (test_series_id, category_id, sub_category_id)
            VALUES (?, ?, ?)
          `, [id, cId, subCat]);
        }
      }
    }

    // Update allowed centres if provided
    if (data.publish_scope === 'SELECTED_CENTRES' && Array.isArray(data.allowed_centre_ids)) {
      await db.query('DELETE FROM test_series_centres WHERE test_series_id = ?', [id]);
      for (const centreId of data.allowed_centre_ids) {
        await db.query(`
          INSERT IGNORE INTO test_series_centres (test_series_id, centre_id)
          VALUES (?, ?)
        `, [id, centreId]);
      }
    } else if (data.publish_scope === 'ALL_CENTRES') {
      await db.query('DELETE FROM test_series_centres WHERE test_series_id = ?', [id]);
    }

    // Audit Log
    await db.query(`
      INSERT INTO test_audit_logs (user_id, user_role, action, entity_type, entity_id, details)
      VALUES (?, 'SUPER_ADMIN', 'UPDATE_TEST_SERIES', 'TEST_SERIES', ?, ?)
    `, [adminUserId || null, id, JSON.stringify({ status: targetStatus, scheduled_publish_time: data.scheduled_publish_time })]);

    return { id, ...data, status: targetStatus };
  },

  cloneDraftSeries: async (id: number | string, adminUserId?: number) => {
    const [existingRows]: any = await db.query('SELECT * FROM test_series WHERE id = ?', [id]);
    if (existingRows.length === 0) throw new Error('Source test series not found');
    const source = existingRows[0];

    const copyTitle = `${source.title} (Draft Copy)`;
    const copySlug = `${source.slug}-draft-${Date.now()}`;

    // 1. Insert cloned test series as DRAFT
    const [resSeries]: any = await db.query(`
      INSERT INTO test_series (
        title, slug, category_id, description, thumbnail_url, instructions,
        exam_type, language, difficulty, total_tests, price, is_free,
        duration_minutes, validity_days, publish_scope, payment_qr_id,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT')
    `, [
      copyTitle,
      copySlug,
      source.category_id,
      source.description,
      source.thumbnail_url,
      source.instructions,
      source.exam_type,
      source.language,
      source.difficulty,
      source.total_tests,
      source.price,
      source.is_free,
      source.duration_minutes,
      source.validity_days,
      source.publish_scope,
      source.payment_qr_id
    ]);

    const newSeriesId = resSeries.insertId;

    // Clone assigned categories
    const [sourceCats]: any = await db.query('SELECT category_id, sub_category_id FROM test_series_categories WHERE test_series_id = ?', [id]);
    for (const cat of sourceCats) {
      await db.query('INSERT IGNORE INTO test_series_categories (test_series_id, category_id, sub_category_id) VALUES (?, ?, ?)', [newSeriesId, cat.category_id, cat.sub_category_id]);
    }

    // 2. Clone allowed centres if SELECTED_CENTRES
    const [centres]: any = await db.query('SELECT centre_id FROM test_series_centres WHERE test_series_id = ?', [id]);
    for (const c of centres) {
      await db.query('INSERT INTO test_series_centres (test_series_id, centre_id) VALUES (?, ?)', [newSeriesId, c.centre_id]);
    }

    // 3. Clone tests and questions
    const [sourceTests]: any = await db.query('SELECT * FROM tests WHERE test_series_id = ?', [id]);
    for (const st of sourceTests) {
      const [resTest]: any = await db.query(`
        INSERT INTO tests (
          test_series_id, title, description, question_count, duration_minutes,
          total_marks, negative_marks, passing_marks, release_type, release_week,
          status, display_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?)
      `, [
        newSeriesId,
        st.title,
        st.description,
        st.question_count,
        st.duration_minutes,
        st.total_marks,
        st.negative_marks,
        st.passing_marks,
        st.release_type,
        st.release_week,
        st.display_order
      ]);

      const newTestId = resTest.insertId;

      // Clone questions and options
      const [questions]: any = await db.query('SELECT * FROM questions WHERE test_id = ?', [st.id]);
      for (const q of questions) {
        const [resQ]: any = await db.query(`
          INSERT INTO questions (
            test_id, question_text, section_name, question_type, explanation,
            marks, negative_marks, display_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          newTestId,
          q.question_text,
          q.section_name,
          q.question_type,
          q.explanation,
          q.marks,
          q.negative_marks,
          q.display_order
        ]);

        const newQId = resQ.insertId;

        const [options]: any = await db.query('SELECT * FROM question_options WHERE question_id = ?', [q.id]);
        for (const opt of options) {
          await db.query(`
            INSERT INTO question_options (question_id, option_key, option_text, is_correct)
            VALUES (?, ?, ?, ?)
          `, [newQId, opt.option_key, opt.option_text, opt.is_correct]);
        }
      }
    }

    // Audit Log
    await db.query(`
      INSERT INTO test_audit_logs (user_id, user_role, action, entity_type, entity_id, details)
      VALUES (?, 'SUPER_ADMIN', 'CLONE_DRAFT_SERIES', 'TEST_SERIES', ?, ?)
    `, [adminUserId || null, newSeriesId, JSON.stringify({ source_id: id, new_id: newSeriesId })]);

    return { id: newSeriesId, title: copyTitle, slug: copySlug, status: 'DRAFT' };
  },

  deleteTestSeries: async (id: number | string, adminUserId?: number) => {
    await db.query('DELETE FROM test_series WHERE id = ?', [id]);
    await db.query(`
      INSERT INTO test_audit_logs (user_id, user_role, action, entity_type, entity_id, details)
      VALUES (?, 'SUPER_ADMIN', 'DELETE_TEST_SERIES', 'TEST_SERIES', ?, ?)
    `, [adminUserId || null, id, JSON.stringify({ id })]);
    return { success: true };
  },

  // ==========================================
  // SUPER ADMIN: TESTS & QUESTIONS MANAGEMENT
  // ==========================================
  getTestsBySeriesAdmin: async (seriesId: number | string) => {
    const [rows]: any = await db.query(`
      SELECT 
        t.*,
        qr.title as qr_title,
        qr.upi_id as qr_upi_id,
        qr.account_name as qr_account_name,
        qr.qr_image_url as qr_image_url,
        (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) as real_question_count,
        (SELECT COUNT(*) FROM test_attempts ta WHERE ta.test_id = t.id) as attempts_count,
        (SELECT AVG(ta.final_score) FROM test_attempts ta WHERE ta.test_id = t.id AND ta.status = 'SUBMITTED') as average_score
      FROM tests t
      LEFT JOIN test_payment_qr qr ON t.payment_qr_id = qr.id
      WHERE t.test_series_id = ?
      ORDER BY t.display_order ASC, t.id ASC
    `, [seriesId]);
    return rows;
  },

  createTest: async (data: any) => {
    const [result]: any = await db.query(`
      INSERT INTO tests (
        test_series_id, title, description, question_count, duration_minutes,
        total_marks, negative_marks, passing_marks, release_type, release_week,
        custom_release_date, is_released, status, display_order,
        payment_qr_id, price, is_free
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.test_series_id,
      data.title,
      data.description || '',
      data.question_count || 0,
      data.duration_minutes || 60,
      data.total_marks || 100.00,
      data.negative_marks || 0.25,
      data.passing_marks || 40.00,
      data.release_type || 'IMMEDIATE',
      data.release_week || 1,
      data.custom_release_date || null,
      data.is_released !== false ? 1 : 0,
      data.status || 'LIVE',
      data.display_order || 1,
      data.payment_qr_id ? Number(data.payment_qr_id) : null,
      data.price !== undefined ? data.price : 0.00,
      data.is_free !== undefined ? (data.is_free ? 1 : 0) : 1
    ]);
    return { id: result.insertId, ...data };
  },

  updateTest: async (id: number | string, data: any) => {
    await db.query(`
      UPDATE tests
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          question_count = COALESCE(?, question_count),
          duration_minutes = COALESCE(?, duration_minutes),
          total_marks = COALESCE(?, total_marks),
          negative_marks = COALESCE(?, negative_marks),
          passing_marks = COALESCE(?, passing_marks),
          release_type = COALESCE(?, release_type),
          release_week = COALESCE(?, release_week),
          custom_release_date = COALESCE(?, custom_release_date),
          is_released = COALESCE(?, is_released),
          status = COALESCE(?, status),
          display_order = COALESCE(?, display_order),
          payment_qr_id = COALESCE(?, payment_qr_id),
          price = COALESCE(?, price),
          is_free = COALESCE(?, is_free)
      WHERE id = ?
    `, [
      data.title,
      data.description,
      data.question_count,
      data.duration_minutes,
      data.total_marks,
      data.negative_marks,
      data.passing_marks,
      data.release_type,
      data.release_week,
      data.custom_release_date,
      data.is_released !== undefined ? (data.is_released ? 1 : 0) : null,
      data.status,
      data.display_order,
      data.payment_qr_id !== undefined ? (data.payment_qr_id ? Number(data.payment_qr_id) : null) : null,
      data.price !== undefined ? data.price : null,
      data.is_free !== undefined ? (data.is_free ? 1 : 0) : null,
      id
    ]);
    return { id, ...data };
  },

  deleteTest: async (id: number | string) => {
    await db.query('DELETE FROM tests WHERE id = ?', [id]);
    return { success: true };
  },

  // Questions & Options
  getQuestionsByTestAdmin: async (testId: number | string) => {
    const [questions]: any = await db.query(`
      SELECT * FROM questions WHERE test_id = ? ORDER BY display_order ASC, id ASC
    `, [testId]);

    for (const q of questions) {
      const [options]: any = await db.query(`
        SELECT * FROM question_options WHERE question_id = ? ORDER BY option_key ASC
      `, [q.id]);
      q.options = options;
    }

    return questions;
  },

  addQuestionWithOption: async (data: any) => {
    let metadataStr: string | null = null;
    if (data.metadata) {
      metadataStr = typeof data.metadata === 'string' ? data.metadata : JSON.stringify(data.metadata);
    } else if (
      data.imageUrls || data.columnA || data.itemsToOrder ||
      data.assertion || data.reason || data.statement1 || data.statement2 ||
      data.passage || data.numerical_range
    ) {
      metadataStr = JSON.stringify({
        imageUrls: data.imageUrls || [],
        columnA: data.columnA || [],
        columnB: data.columnB || [],
        itemsToOrder: data.itemsToOrder || [],
        assertion: data.assertion || '',
        reason: data.reason || '',
        statement1: data.statement1 || '',
        statement2: data.statement2 || '',
        passage: data.passage || '',
        numerical_range: data.numerical_range || null
      });
    }

    const [result]: any = await db.query(`
      INSERT INTO questions (test_id, question_text, section_name, question_type, image_url, explanation, metadata, marks, negative_marks, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.test_id,
      data.question_text,
      data.section_name || 'General Assessment',
      data.question_type || 'SINGLE_CHOICE',
      data.image_url || null,
      data.explanation || '',
      metadataStr,
      data.marks || 2.00,
      data.negative_marks || 0.50,
      data.display_order || 1
    ]);

    const qId = result.insertId;

    if (Array.isArray(data.options)) {
      for (let idx = 0; idx < data.options.length; idx++) {
        const opt = data.options[idx];
        const optKey = opt.option_key || opt.k || String.fromCharCode(65 + idx);
        const optText = opt.option_text !== undefined && opt.option_text !== null ? String(opt.option_text) : (opt.t !== undefined && opt.t !== null ? String(opt.t) : '');
        await db.query(`
          INSERT INTO question_options (question_id, option_key, option_text, image_url, is_correct)
          VALUES (?, ?, ?, ?, ?)
        `, [
          qId,
          optKey,
          optText,
          opt.image_url || null,
          (opt.is_correct === 1 || opt.is_correct === true || String(opt.is_correct) === '1' || String(opt.is_correct) === 'true') ? 1 : 0
        ]);
      }
    }

    // Sync question_count on test
    const [countRows]: any = await db.query('SELECT COUNT(*) as cnt FROM questions WHERE test_id = ?', [data.test_id]);
    await db.query('UPDATE tests SET question_count = ? WHERE id = ?', [countRows[0].cnt, data.test_id]);

    return { id: qId, ...data };
  },

  updateQuestion: async (id: number | string, data: any) => {
    const [existingRows]: any = await db.query('SELECT * FROM questions WHERE id = ?', [id]);
    if (!existingRows || existingRows.length === 0) {
      throw new Error('Question not found');
    }
    const currentQ = existingRows[0];

    let metadataStr: string | null = null;
    if (data.metadata !== undefined) {
      metadataStr = typeof data.metadata === 'string' ? data.metadata : JSON.stringify(data.metadata);
    } else if (
      data.imageUrls !== undefined || data.columnA !== undefined || data.itemsToOrder !== undefined ||
      data.assertion !== undefined || data.reason !== undefined || data.statement1 !== undefined || data.statement2 !== undefined ||
      data.passage !== undefined || data.numerical_range !== undefined
    ) {
      metadataStr = JSON.stringify({
        imageUrls: data.imageUrls || [],
        columnA: data.columnA || [],
        columnB: data.columnB || [],
        itemsToOrder: data.itemsToOrder || [],
        assertion: data.assertion || '',
        reason: data.reason || '',
        statement1: data.statement1 || '',
        statement2: data.statement2 || '',
        passage: data.passage || '',
        numerical_range: data.numerical_range || null
      });
    } else {
      metadataStr = currentQ.metadata;
    }

    await db.query(`
      UPDATE questions SET
        question_text = ?,
        section_name = ?,
        question_type = ?,
        image_url = ?,
        explanation = ?,
        metadata = ?,
        marks = ?,
        negative_marks = ?,
        display_order = ?
      WHERE id = ?
    `, [
      data.question_text !== undefined ? data.question_text : currentQ.question_text,
      data.section_name !== undefined ? data.section_name : currentQ.section_name,
      data.question_type !== undefined ? data.question_type : currentQ.question_type,
      data.image_url !== undefined ? data.image_url : currentQ.image_url,
      data.explanation !== undefined ? data.explanation : currentQ.explanation,
      metadataStr,
      data.marks !== undefined ? data.marks : currentQ.marks,
      data.negative_marks !== undefined ? data.negative_marks : currentQ.negative_marks,
      data.display_order !== undefined ? data.display_order : currentQ.display_order,
      id
    ]);

    if (Array.isArray(data.options)) {
      await db.query('DELETE FROM question_options WHERE question_id = ?', [id]);
      for (let idx = 0; idx < data.options.length; idx++) {
        const opt = data.options[idx];
        const optKey = opt.option_key || opt.k || String.fromCharCode(65 + idx);
        const optText = opt.option_text !== undefined && opt.option_text !== null ? String(opt.option_text) : (opt.t !== undefined && opt.t !== null ? String(opt.t) : '');
        await db.query(`
          INSERT INTO question_options (question_id, option_key, option_text, image_url, is_correct)
          VALUES (?, ?, ?, ?, ?)
        `, [
          id,
          optKey,
          optText,
          opt.image_url || null,
          (opt.is_correct === 1 || opt.is_correct === true || String(opt.is_correct) === '1' || String(opt.is_correct) === 'true') ? 1 : 0
        ]);
      }
    }

    return { id, ...data };
  },

  bulkAddQuestions: async (testId: number | string, questions: any[]) => {
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Questions array is required');
    }

    const insertedIds: number[] = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qType = (q.question_type || q.questionType || (q.imageUrl || q.image_url ? 'IMAGE_MCQ' : (q.columnA ? 'MATCH_FOLLOWING' : (q.assertion ? 'ASSERTION_REASON' : (q.statement1 ? 'STATEMENT_ANALYSIS' : 'SINGLE_CHOICE'))))).toUpperCase();
      const imgUrl = q.image_url || q.imageUrl || null;
      const metadata = q.metadata ? (typeof q.metadata === 'string' ? q.metadata : JSON.stringify(q.metadata)) : (
        q.columnA || q.columnB || q.assertion || q.reason || q.statement1 || q.statement2 || q.passage || q.itemsToOrder ? JSON.stringify({
          columnA: q.columnA || [],
          columnB: q.columnB || [],
          assertion: q.assertion || '',
          reason: q.reason || '',
          statement1: q.statement1 || '',
          statement2: q.statement2 || '',
          passage: q.passage || '',
          itemsToOrder: q.itemsToOrder || [],
          correctMatches: q.correctMatches || q.correct_matches
        }) : null
      );

      const [result]: any = await db.query(`
        INSERT INTO questions (test_id, question_text, section_name, question_type, image_url, explanation, metadata, marks, negative_marks, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        testId,
        q.question_text || q.question || '',
        q.section_name || q.section || 'General Assessment',
        qType,
        imgUrl,
        q.explanation || '',
        metadata,
        q.marks !== undefined ? Number(q.marks) : 2.00,
        q.negative_marks !== undefined ? Number(q.negative_marks) : 0.50,
        q.display_order || (i + 1)
      ]);

      const qId = result.insertId;
      insertedIds.push(qId);

      let normalizedOptions: { option_key: string; option_text: string; image_url?: string | null; is_correct: boolean }[] = [];

      if (qType === 'TRUE_FALSE') {
        const corr = String(q.correct_option || q.correctOption || q.correct || 'True').trim().toLowerCase();
        normalizedOptions = [
          { option_key: 'A', option_text: 'True', is_correct: corr === 'true' || corr === 'a' },
          { option_key: 'B', option_text: 'False', is_correct: corr === 'false' || corr === 'b' }
        ];
      } else if (Array.isArray(q.options)) {
        normalizedOptions = q.options.map((opt: any, idx: number) => {
          const key = (opt.option_key || opt.key || String.fromCharCode(65 + idx)).toUpperCase();
          const text = typeof opt === 'string' ? opt : (opt.option_text || opt.text || opt.t || '');
          const optImg = typeof opt === 'object' ? (opt.image_url || opt.imageUrl || null) : null;
          let isCorrect = false;
          if (typeof opt === 'object' && opt.is_correct !== undefined) {
            isCorrect = Boolean(opt.is_correct);
          } else if (typeof opt === 'object' && opt.isCorrect !== undefined) {
            isCorrect = Boolean(opt.isCorrect);
          } else if (q.correct_option !== undefined || q.correctOption !== undefined || q.correct !== undefined) {
            const corr = String(q.correct_option || q.correctOption || q.correct).trim().toUpperCase();
            isCorrect = corr === key || corr === text.trim().toUpperCase() || String(idx) === corr;
          }
          return { option_key: key, option_text: text, image_url: optImg, is_correct: isCorrect };
        });
      } else if (q.optionA || q.option_a || q.a) {
        const optA = q.optionA || q.option_a || q.a || '';
        const optB = q.optionB || q.option_b || q.b || '';
        const optC = q.optionC || q.option_c || q.c || '';
        const optD = q.optionD || q.option_d || q.d || '';
        const corr = String(q.correct_option || q.correctOption || q.correct || 'A').trim().toUpperCase();

        normalizedOptions = [
          { option_key: 'A', option_text: optA, is_correct: corr === 'A' || corr === optA.trim().toUpperCase() },
          { option_key: 'B', option_text: optB, is_correct: corr === 'B' || corr === optB.trim().toUpperCase() },
          { option_key: 'C', option_text: optC, is_correct: corr === 'C' || corr === optC.trim().toUpperCase() },
          { option_key: 'D', option_text: optD, is_correct: corr === 'D' || corr === optD.trim().toUpperCase() },
        ];
      }

      for (const opt of normalizedOptions) {
        await db.query(`
          INSERT INTO question_options (question_id, option_key, option_text, image_url, is_correct)
          VALUES (?, ?, ?, ?, ?)
        `, [qId, opt.option_key, opt.option_text, opt.image_url || null, opt.is_correct ? 1 : 0]);
      }
    }

    // Sync question_count on test
    const [countRows]: any = await db.query('SELECT COUNT(*) as cnt FROM questions WHERE test_id = ?', [testId]);
    await db.query('UPDATE tests SET question_count = ? WHERE id = ?', [countRows[0].cnt, testId]);

    return {
      success: true,
      importedCount: insertedIds.length,
      test_id: testId
    };
  },

  deleteQuestion: async (id: number | string) => {
    const [q]: any = await db.query('SELECT test_id FROM questions WHERE id = ?', [id]);
    const testId = q[0]?.test_id;
    await db.query('DELETE FROM questions WHERE id = ?', [id]);
    if (testId) {
      const [countRows]: any = await db.query('SELECT COUNT(*) as cnt FROM questions WHERE test_id = ?', [testId]);
      await db.query('UPDATE tests SET question_count = ? WHERE id = ?', [countRows[0].cnt, testId]);
    }
    return { success: true };
  },

  // ==========================================
  // SUPER ADMIN: PAYMENT REQUESTS & UTR VERIFICATION
  // ==========================================
  getPaymentRequestsAdmin: async (statusFilter?: string) => {
    let query = `
      SELECT 
        tp.*,
        s.firstName as student_first_name,
        s.lastName as student_last_name,
        s.enrollment_no,
        s.roll_no,
        s.phone as student_phone,
        s.email as student_email,
        ts.title as test_series_title,
        ts.price as series_price,
        cntr.name as centre_name,
        cntr.center_code as centre_code,
        cntr.city as centre_city
      FROM test_payments tp
      JOIN students s ON tp.student_id = s.id
      JOIN test_series ts ON tp.test_series_id = ts.id
      JOIN centers cntr ON tp.centre_id = cntr.id
    `;
    const params: any[] = [];
    if (statusFilter && statusFilter !== 'ALL') {
      query += ' WHERE tp.status = ?';
      params.push(statusFilter);
    }
    query += ' ORDER BY tp.submitted_at DESC';

    const [rows]: any = await db.query(query, params);
    return rows;
  },

  approvePayment: async (paymentId: number | string, adminUserId?: number) => {
    const [payments]: any = await db.query('SELECT * FROM test_payments WHERE id = ?', [paymentId]);
    if (payments.length === 0) throw new Error('Payment record not found');
    const payment = payments[0];

    // 1. Mark payment APPROVED
    await db.query(`
      UPDATE test_payments
      SET status = 'APPROVED', verified_by = ?, verified_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [adminUserId || null, paymentId]);

    // 2. Fetch series validity days
    const [series]: any = await db.query('SELECT validity_days, title FROM test_series WHERE id = ?', [payment.test_series_id]);
    const validityDays = series[0]?.validity_days || 90;

    // 3. Grant ACTIVE Enrollment
    await db.query(`
      INSERT INTO test_series_enrollments (student_id, test_series_id, centre_id, enrollment_type, status, expires_at)
      VALUES (?, ?, ?, 'PAID', 'ACTIVE', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? DAY))
      ON DUPLICATE KEY UPDATE
        status = 'ACTIVE',
        expires_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? DAY),
        enrolled_at = CURRENT_TIMESTAMP
    `, [payment.student_id, payment.test_series_id, payment.centre_id, validityDays, validityDays]);

    // 4. Send Notification to Student
    await db.query(`
      INSERT INTO test_notifications (recipient_type, recipient_id, title, message, link_url)
      VALUES ('STUDENT', ?, 'Test Series Payment Approved!', ?, '/student/dashboard')
    `, [
      payment.student_id,
      `Your payment of ₹${payment.amount} for "${series[0]?.title || 'Test Series'}" (UTR: ${payment.utr_number}) has been verified. You now have full access to all tests!`
    ]);

    // 5. Audit Log
    await db.query(`
      INSERT INTO test_audit_logs (user_id, user_role, action, entity_type, entity_id, details)
      VALUES (?, 'SUPER_ADMIN', 'APPROVE_PAYMENT', 'TEST_PAYMENT', ?, ?)
    `, [adminUserId || null, paymentId, JSON.stringify({ student_id: payment.student_id, utr: payment.utr_number, amount: payment.amount })]);

    return { success: true, message: 'Payment approved and student access activated successfully.' };
  },

  rejectPayment: async (paymentId: number | string, reason: string, adminUserId?: number) => {
    const [payments]: any = await db.query('SELECT * FROM test_payments WHERE id = ?', [paymentId]);
    if (payments.length === 0) throw new Error('Payment record not found');
    const payment = payments[0];

    // 1. Mark payment REJECTED
    await db.query(`
      UPDATE test_payments
      SET status = 'REJECTED', rejection_reason = ?, verified_by = ?, verified_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [reason || 'Payment verification failed', adminUserId || null, paymentId]);

    // 2. Mark Enrollment REJECTED
    await db.query(`
      UPDATE test_series_enrollments
      SET status = 'REJECTED'
      WHERE student_id = ? AND test_series_id = ?
    `, [payment.student_id, payment.test_series_id]);

    // 3. Send Notification to Student
    await db.query(`
      INSERT INTO test_notifications (recipient_type, recipient_id, title, message, link_url)
      VALUES ('STUDENT', ?, 'Payment Verification Update', ?, '/student/dashboard')
    `, [
      payment.student_id,
      `Your payment of ₹${payment.amount} (UTR: ${payment.utr_number}) was rejected: "${reason || 'Invalid transaction reference'}". Please contact support or resubmit valid payment details.`
    ]);

    // 4. Audit Log
    await db.query(`
      INSERT INTO test_audit_logs (user_id, user_role, action, entity_type, entity_id, details)
      VALUES (?, 'SUPER_ADMIN', 'REJECT_PAYMENT', 'TEST_PAYMENT', ?, ?)
    `, [adminUserId || null, paymentId, JSON.stringify({ student_id: payment.student_id, utr: payment.utr_number, reason })]);

    return { success: true, message: 'Payment rejected.' };
  },

  // ==========================================
  // SUPER ADMIN: ATTEMPTS MANAGEMENT & RESET
  // ==========================================
  getAllAttemptsAdmin: async (seriesId?: number | string) => {
    let query = `
      SELECT 
        ta.*,
        s.firstName as student_first_name,
        s.lastName as student_last_name,
        s.enrollment_no,
        t.title as test_title,
        ts.title as test_series_title,
        COALESCE(cntr.name, 'Direct Student') as centre_name,
        COALESCE(cntr.center_code, 'DIRECT') as centre_code
      FROM test_attempts ta
      JOIN students s ON ta.student_id = s.id
      JOIN tests t ON ta.test_id = t.id
      JOIN test_series ts ON ta.test_series_id = ts.id
      LEFT JOIN centers cntr ON s.centerId = cntr.id
    `;
    const params: any[] = [];
    if (seriesId) {
      query += ' WHERE ta.test_series_id = ?';
      params.push(seriesId);
    }
    query += ' ORDER BY ta.started_at DESC LIMIT 100';

    const [rows]: any = await db.query(query, params);
    return rows;
  },

  resetAttempt: async (attemptId: number | string, reason: string, adminUserId?: number) => {
    const [attempts]: any = await db.query('SELECT * FROM test_attempts WHERE id = ?', [attemptId]);
    if (attempts.length === 0) throw new Error('Attempt not found');
    const att = attempts[0];

    // Mark as RESET with audit trail instead of hard deleting historical record
    await db.query(`
      UPDATE test_attempts
      SET status = 'RESET', reset_reason = ?, reset_by = ?, reset_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [reason || 'Reset by administration', adminUserId || null, attemptId]);

    // Audit log
    await db.query(`
      INSERT INTO test_audit_logs (user_id, user_role, action, entity_type, entity_id, details)
      VALUES (?, 'SUPER_ADMIN', 'RESET_TEST_ATTEMPT', 'TEST_ATTEMPT', ?, ?)
    `, [adminUserId || null, attemptId, JSON.stringify({ student_id: att.student_id, test_id: att.test_id, reason })]);

    return { success: true, message: 'Test attempt reset successfully. Student may now start a fresh test.' };
  },

  // ==========================================
  // SUPER ADMIN: PLATFORM ANALYTICS
  // ==========================================
  getPlatformAnalytics: async () => {
    const [seriesCount]: any = await db.query('SELECT COUNT(*) as count FROM test_series');
    const [publishedCount]: any = await db.query('SELECT COUNT(*) as count FROM test_series WHERE status = "PUBLISHED"');
    const [freeCount]: any = await db.query('SELECT COUNT(*) as count FROM test_series WHERE is_free = TRUE');
    const [paidCount]: any = await db.query('SELECT COUNT(*) as count FROM test_series WHERE is_free = FALSE');

    const [enrollments]: any = await db.query(`
      SELECT SUM(
        CASE 
          WHEN ts.is_free = 1 AND ts.publish_scope = 'ALL_CENTRES' THEN 
            (SELECT COUNT(*) FROM students WHERE status = 'active')
          WHEN ts.is_free = 1 AND ts.publish_scope = 'SELECTED_CENTRES' THEN 
            (SELECT COUNT(*) FROM students s JOIN test_series_centres tsc ON s.centerId = tsc.centre_id WHERE tsc.test_series_id = ts.id AND s.status = 'active')
          ELSE 
            (SELECT COUNT(*) FROM test_series_enrollments tse JOIN students s ON tse.student_id = s.id WHERE tse.test_series_id = ts.id AND tse.status = 'ACTIVE' AND s.status = 'active')
        END
      ) as count FROM test_series ts WHERE ts.status = 'PUBLISHED'
    `);
    const [pendingPayments]: any = await db.query('SELECT COUNT(*) as count FROM test_payments WHERE status = "PENDING"');
    const [approvedPayments]: any = await db.query('SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as totalRevenue FROM test_payments WHERE status = "APPROVED"');
    const [attemptsCount]: any = await db.query('SELECT COUNT(*) as count FROM test_attempts WHERE status = "SUBMITTED"');
    const [avgScore]: any = await db.query('SELECT COALESCE(AVG(percentage), 0) as avgPercentage FROM test_attempts WHERE status = "SUBMITTED"');

    // Recent 10 payments
    const [recentPayments]: any = await db.query(`
      SELECT 
        tp.*,
        s.firstName as student_first_name,
        s.lastName as student_last_name,
        ts.title as test_series_title
      FROM test_payments tp
      JOIN students s ON tp.student_id = s.id
      JOIN test_series ts ON tp.test_series_id = ts.id
      ORDER BY tp.submitted_at DESC
      LIMIT 10
    `);

    const [notesStats]: any = await db.query(`
      SELECT 
        (
          COALESCE((SELECT COUNT(*) FROM study_material_purchases WHERE status = 'APPROVED'), 0) +
          COALESCE((SELECT COUNT(*) FROM center_material_purchases WHERE status = 'APPROVED'), 0)
        ) as totalNotesPurchases,
        (
          COALESCE((SELECT SUM(amount) FROM study_material_purchases WHERE status = 'APPROVED'), 0) +
          COALESCE((SELECT SUM(amount) FROM center_material_purchases WHERE status = 'APPROVED'), 0)
        ) as totalNotesRevenue
    `);

    const testRevenue = Number(approvedPayments[0]?.totalRevenue) || 0;
    const testPurchases = Number(approvedPayments[0]?.count) || 0;
    const notesRevenue = Number(notesStats[0]?.totalNotesRevenue) || 0;
    const notesPurchases = Number(notesStats[0]?.totalNotesPurchases) || 0;

    return {
      kpis: {
        totalSeries: seriesCount[0]?.count || 0,
        publishedSeries: publishedCount[0]?.count || 0,
        freeSeries: freeCount[0]?.count || 0,
        paidSeries: paidCount[0]?.count || 0,
        totalEnrollments: enrollments[0]?.count || 0,
        pendingPayments: pendingPayments[0]?.count || 0,
        totalRevenue: testRevenue,
        testSeriesPurchases: testPurchases,
        testSeriesRevenue: testRevenue,
        notesPurchases: notesPurchases,
        notesRevenue: notesRevenue,
        combinedDigitalRevenue: testRevenue + notesRevenue,
        testsCompleted: attemptsCount[0]?.count || 0,
        averagePercentage: Number(avgScore[0]?.avgPercentage || 0).toFixed(1)
      },
      recentPayments
    };
  },

  // ==========================================
  // STUDENT API: ELIGIBLE SERIES & DISCOVERY
  // ==========================================
  getStudentEligibleSeries: async (studentId: number | string) => {
    // 1. Fetch student center
    let centreId: any = null;
    const safeStudentId = studentId ? (Number(studentId) || 0) : 0;
    if (safeStudentId > 0) {
      try {
        const [studentRows]: any = await db.query('SELECT id, centerId, status FROM students WHERE id = ?', [safeStudentId]);
        if (studentRows && studentRows.length > 0) {
          centreId = studentRows[0].centerId;
        }
      } catch (e) {
        console.warn('Error fetching student for eligible series:', e);
      }
    }

    // 2. Fetch all PUBLISHED test series that are either ALL_CENTRES or matching student's centreId
    const [series]: any = await db.query(`
      SELECT 
        ts.*,
        c.name as category_name,
        c.slug as category_slug,
        sc.name as sub_category_name,
        COALESCE(qr.upi_id, gqr.upi_id) as upi_id,
        COALESCE(qr.account_name, gqr.account_name) as account_name,
        COALESCE(qr.qr_image_url, gqr.qr_image_url) as qr_image_url,
        COALESCE(qr.instructions, gqr.instructions) as qr_instructions,
        (SELECT COUNT(*) FROM tests t WHERE t.test_series_id = ts.id AND t.status = 'LIVE') as live_tests_count,
        CASE 
          WHEN tse.status = 'ACTIVE' THEN 'APPROVED'
          WHEN tse.status = 'PAYMENT_PENDING' THEN 'PAYMENT_PENDING'
          WHEN tp.status = 'APPROVED' THEN 'APPROVED'
          WHEN tp.status = 'PENDING' THEN 'PAYMENT_PENDING'
          WHEN (ts.is_free = 1 OR ts.price = 0) AND tse.id IS NOT NULL THEN 'APPROVED'
          WHEN (ts.is_free = 1 OR ts.price = 0) THEN 'FREE_AVAILABLE'
          WHEN tse.status IS NOT NULL THEN tse.status
          ELSE 'NOT_ENROLLED' 
        END as enrollment_status,
        tse.expires_at,
        tp.status as latest_payment_status,
        tp.utr_number as latest_utr
      FROM test_series ts
      LEFT JOIN test_categories c ON ts.category_id = c.id
      LEFT JOIN test_sub_categories sc ON ts.sub_category_id = sc.id
      LEFT JOIN test_payment_qr qr ON ts.payment_qr_id = qr.id
      LEFT JOIN (
        SELECT * FROM test_payment_qr WHERE is_global_default = 1 ORDER BY id DESC LIMIT 1
      ) gqr ON 1=1
      LEFT JOIN test_series_centres tsc ON ts.id = tsc.test_series_id AND tsc.centre_id = ?
      LEFT JOIN test_series_enrollments tse ON ts.id = tse.test_series_id AND tse.student_id = ?
      LEFT JOIN test_payments tp ON tp.id = (
        SELECT MAX(id) FROM test_payments WHERE test_series_id = ts.id AND student_id = ?
      )
      WHERE ts.status = 'PUBLISHED'
        AND (ts.publish_scope = 'ALL_CENTRES' OR tsc.centre_id IS NOT NULL)
      ORDER BY ts.is_free DESC, ts.id DESC
    `, [centreId, safeStudentId, safeStudentId]);

    // Check if student has active Elite Pass
    if (safeStudentId) {
      try {
        const [stuPass]: any = await db.query(
          `SELECT active_pass_type, pass_expires_at FROM students WHERE id = ?`,
          [safeStudentId]
        );
        if (stuPass.length > 0 && stuPass[0].active_pass_type === 'ELITE' && stuPass[0].pass_expires_at) {
          if (new Date(stuPass[0].pass_expires_at).getTime() > Date.now()) {
            series.forEach((s: any) => {
              s.enrollment_status = 'APPROVED';
              s.unlocked_via_elite_pass = true;
            });
          }
        }
      } catch (err) { }
    }

    // Populate tests inside each series for the student
    if (series.length > 0) {
      const seriesIds = series.map((s: any) => s.id);
      const [tests]: any = await db.query(`
        SELECT 
          t.*,
          (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) as questions_count,
          (SELECT COUNT(*) FROM test_attempts ta WHERE ta.test_id = t.id AND ta.student_id = ? AND ta.status != 'RESET') as student_attempts_count,
          ta_latest.id as latest_attempt_id,
          ta_latest.status as latest_attempt_status,
          ta_latest.final_score as latest_attempt_score,
          ta_latest.percentage as latest_attempt_percentage,
          ta_latest.submitted_at as latest_attempt_submitted_at,
          ta_latest.correct_answers as latest_attempt_correct_answers,
          ta_latest.incorrect_answers as latest_attempt_incorrect_answers,
          ta_latest.unanswered as latest_attempt_unanswered,
          ta_latest.accuracy as latest_attempt_accuracy,
          ta_latest.duration_seconds as latest_attempt_duration_seconds
        FROM tests t
        LEFT JOIN test_attempts ta_latest ON ta_latest.id = (
          SELECT MAX(id) FROM test_attempts 
          WHERE test_id = t.id AND student_id = ? AND status != 'RESET'
        )
        WHERE t.test_series_id IN (?) AND t.status = 'LIVE'
        ORDER BY t.display_order ASC, t.id ASC
      `, [safeStudentId, safeStudentId, seriesIds]);

      const testsBySeries = new Map<number, any[]>();
      for (const t of tests) {
        const testItem = {
          ...t,
          questions_count: Number(t.questions_count || 0),
          student_attempts_count: Number(t.student_attempts_count || 0),
          latest_attempt: t.latest_attempt_id ? {
            id: t.latest_attempt_id,
            status: t.latest_attempt_status,
            final_score: t.latest_attempt_score,
            percentage: t.latest_attempt_percentage,
            submitted_at: t.latest_attempt_submitted_at,
            correct_answers: Number(t.latest_attempt_correct_answers || 0),
            incorrect_answers: Number(t.latest_attempt_incorrect_answers || 0),
            unanswered: Number(t.latest_attempt_unanswered || 0),
            accuracy: Number(t.latest_attempt_accuracy || 0),
            duration_seconds: Number(t.latest_attempt_duration_seconds || 0),
            passed: Number(t.latest_attempt_score || 0) >= Number(t.passing_marks || 0),
            passing_marks: t.passing_marks
          } : null
        };
        if (!testsBySeries.has(t.test_series_id)) {
          testsBySeries.set(t.test_series_id, []);
        }
        testsBySeries.get(t.test_series_id)!.push(testItem);
      }

      for (const s of series) {
        s.tests = testsBySeries.get(s.id) || [];
      }

      // Populate assigned categories for multi-category filtering in student portal
      const [allCats]: any = await db.query(`
        SELECT tsc.test_series_id, tsc.category_id, tc.name as category_name
        FROM test_series_categories tsc
        JOIN test_categories tc ON tsc.category_id = tc.id
        WHERE tsc.test_series_id IN (?)
      `, [seriesIds]);

      const catMap = new Map<number, any[]>();
      for (const c of allCats) {
        const sId = Number(c.test_series_id);
        if (!catMap.has(sId)) catMap.set(sId, []);
        catMap.get(sId)!.push({
          id: Number(c.category_id),
          name: c.category_name
        });
      }

      for (const s of series) {
        const cats = catMap.get(Number(s.id)) || [];
        s.assigned_categories = cats;
        s.category_ids = cats.map(c => c.id);
        if (s.category_id && !s.category_ids.includes(Number(s.category_id))) {
          s.category_ids.push(Number(s.category_id));
        }
      }
    } else {
      for (const s of series) {
        s.tests = [];
        s.assigned_categories = [];
        s.category_ids = s.category_id ? [Number(s.category_id)] : [];
      }
    }

    return series;
  },

  getSeriesDetailForStudent: async (seriesId: number | string, studentId: number | string) => {
    // 1. Verify eligibility
    const [studentRows]: any = await db.query('SELECT id, centerId FROM students WHERE id = ?', [studentId]);
    if (studentRows.length === 0) throw new Error('Student not found');
    const centreId = studentRows[0].centerId;

    const [seriesRows]: any = await db.query(`
      SELECT 
        ts.*,
        c.name as category_name,
        COALESCE(qr.upi_id, gqr.upi_id) as upi_id,
        COALESCE(qr.account_name, gqr.account_name) as account_name,
        COALESCE(qr.qr_image_url, gqr.qr_image_url) as qr_image_url,
        COALESCE(qr.instructions, gqr.instructions) as qr_instructions,
        CASE 
          WHEN tse.status = 'ACTIVE' THEN 'APPROVED'
          WHEN tse.status = 'PAYMENT_PENDING' THEN 'PAYMENT_PENDING'
          WHEN tp.status = 'APPROVED' THEN 'APPROVED'
          WHEN tp.status = 'PENDING' THEN 'PAYMENT_PENDING'
          WHEN (ts.is_free = 1 OR ts.price = 0) AND tse.id IS NOT NULL THEN 'APPROVED'
          WHEN (ts.is_free = 1 OR ts.price = 0) THEN 'FREE_AVAILABLE'
          WHEN tse.status IS NOT NULL THEN tse.status
          ELSE 'NOT_ENROLLED' 
        END as enrollment_status,
        tse.expires_at,
        tp.status as payment_status,
        tp.utr_number,
        tp.rejection_reason,
        sc.name as sub_category_name
      FROM test_series ts
      LEFT JOIN test_categories c ON ts.category_id = c.id
      LEFT JOIN test_sub_categories sc ON ts.sub_category_id = sc.id
      LEFT JOIN test_payment_qr qr ON ts.payment_qr_id = qr.id
      LEFT JOIN (
        SELECT * FROM test_payment_qr WHERE is_global_default = 1 ORDER BY id DESC LIMIT 1
      ) gqr ON 1=1
      LEFT JOIN test_series_centres tsc ON ts.id = tsc.test_series_id AND tsc.centre_id = ?
      LEFT JOIN test_series_enrollments tse ON ts.id = tse.test_series_id AND tse.student_id = ?
      LEFT JOIN test_payments tp ON tp.id = (
        SELECT MAX(id) FROM test_payments WHERE test_series_id = ts.id AND student_id = ?
      )
      WHERE ts.id = ? AND ts.status = 'PUBLISHED'
        AND (ts.publish_scope = 'ALL_CENTRES' OR tsc.centre_id IS NOT NULL)
      LIMIT 1
    `, [centreId, studentId, studentId, seriesId]);

    if (seriesRows.length === 0) {
      throw new Error('This Test Series is not available for your center or is unpublished.');
    }

    const series = seriesRows[0];

    // Check if student has active Elite Pass
    if (studentId) {
      try {
        const [stuPass]: any = await db.query(
          `SELECT active_pass_type, pass_expires_at FROM students WHERE id = ?`,
          [studentId]
        );
        if (stuPass.length > 0 && stuPass[0].active_pass_type === 'ELITE' && stuPass[0].pass_expires_at) {
          if (new Date(stuPass[0].pass_expires_at).getTime() > Date.now()) {
            series.enrollment_status = 'APPROVED';
            series.unlocked_via_elite_pass = true;
          }
        }
      } catch (err) { }
    }

    // If payment QR is not series-specific, fetch global default
    if (!series.upi_id) {
      const [globalQr]: any = await db.query('SELECT upi_id, account_name, qr_image_url, instructions FROM test_payment_qr WHERE is_global_default = TRUE LIMIT 1');
      if (globalQr.length > 0) {
        series.upi_id = globalQr[0].upi_id;
        series.account_name = globalQr[0].account_name;
        series.qr_image_url = globalQr[0].qr_image_url;
        series.qr_instructions = globalQr[0].instructions;
      }
    }

    // Fetch tests inside this series with student's attempt status
    const [tests]: any = await db.query(`
      SELECT 
        t.*,
        qr.title as qr_title,
        qr.upi_id as qr_upi_id,
        qr.account_name as qr_account_name,
        qr.qr_image_url as qr_image_url,
        qr.instructions as qr_instructions,
        (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) as real_question_count,
        ta.id as last_attempt_id,
        ta.status as attempt_status,
        ta.final_score as last_score,
        ta.percentage as last_percentage,
        ta.submitted_at as last_submitted_at
      FROM tests t
      LEFT JOIN test_payment_qr qr ON t.payment_qr_id = qr.id
      LEFT JOIN test_attempts ta ON t.id = ta.test_id AND ta.student_id = ? AND ta.status != 'RESET'
      WHERE t.test_series_id = ? AND t.status = 'LIVE'
      ORDER BY t.display_order ASC, t.id ASC
    `, [studentId, seriesId]);

    series.tests = tests;
    return series;
  },

  // ==========================================
  // STUDENT ENROLLMENT & PAYMENT SUBMISSION
  // ==========================================
  enrollFreeSeries: async (seriesId: number | string, studentId: number | string) => {
    // 1. Verify student & centre
    const [studentRows]: any = await db.query('SELECT id, centerId FROM students WHERE id = ?', [studentId]);
    if (studentRows.length === 0) throw new Error('Student not found');
    const centreId = studentRows[0].centerId;

    // 2. Verify series is free & published
    const [seriesRows]: any = await db.query(`
      SELECT id, title, is_free, validity_days, publish_scope FROM test_series
      WHERE id = ? AND status = 'PUBLISHED'
    `, [seriesId]);

    if (seriesRows.length === 0) throw new Error('Test series not found or unavailable');
    const series = seriesRows[0];
    if (!series.is_free) throw new Error('This is a paid Test Series. Please complete payment.');

    // 3. Check centre eligibility
    if (series.publish_scope === 'SELECTED_CENTRES') {
      const [allowed]: any = await db.query('SELECT id FROM test_series_centres WHERE test_series_id = ? AND centre_id = ?', [seriesId, centreId]);
      if (allowed.length === 0) throw new Error('This Test Series is not available for your center.');
    }

    const validity = series.validity_days || 180;

    await db.query(`
      INSERT INTO test_series_enrollments (student_id, test_series_id, centre_id, enrollment_type, status, expires_at)
      VALUES (?, ?, ?, 'FREE', 'ACTIVE', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? DAY))
      ON DUPLICATE KEY UPDATE
        status = 'ACTIVE',
        expires_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? DAY)
    `, [studentId, seriesId, centreId, validity, validity]);

    return { success: true, message: 'Enrolled successfully in free test series.' };
  },

  submitPaidUtrPayment: async (data: {
    studentId: number | string;
    seriesId: number | string;
    utrNumber: string;
    screenshot?: string;
  }) => {
    const { studentId, seriesId, utrNumber, screenshot } = data;

    const cleanUtr = utrNumber.trim().toUpperCase();
    if (!cleanUtr || cleanUtr.length < 6) {
      throw new Error('Please enter a valid 12-digit UPI UTR / Transaction Reference number.');
    }

    // 1. Duplicate UTR check
    const [existingUtr]: any = await db.query('SELECT id FROM test_payments WHERE utr_number = ?', [cleanUtr]);
    if (existingUtr.length > 0) {
      throw new Error('This UTR number has already been submitted or processed. Duplicate transaction IDs are not accepted.');
    }

    // 2. Verify student & centre
    const [studentRows]: any = await db.query('SELECT id, centerId, firstName, lastName FROM students WHERE id = ?', [studentId]);
    if (studentRows.length === 0) throw new Error('Student not found');
    const student = studentRows[0];
    const centreId = student.centerId;

    // 3. Verify series
    const [seriesRows]: any = await db.query('SELECT id, title, price, is_free, payment_qr_id FROM test_series WHERE id = ?', [seriesId]);
    if (seriesRows.length === 0) throw new Error('Test series not found');
    const series = seriesRows[0];

    let screenUrl = screenshot;
    if (screenUrl && screenUrl.startsWith('data:image/')) {
      screenUrl = saveBase64File(screenUrl, `utr-proof-${Date.now()}`, 'payment-proofs');
    }

    // 4. Insert Payment Record
    const [payResult]: any = await db.query(`
      INSERT INTO test_payments (
        student_id, test_series_id, centre_id, amount, utr_number,
        payment_screenshot, payment_qr_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `, [studentId, seriesId, centreId, series.price, cleanUtr, screenUrl || '', series.payment_qr_id || null]);

    // 5. Insert / Update Enrollment as PAYMENT_PENDING
    await db.query(`
      INSERT INTO test_series_enrollments (student_id, test_series_id, centre_id, enrollment_type, status)
      VALUES (?, ?, ?, 'PAID', 'PAYMENT_PENDING')
      ON DUPLICATE KEY UPDATE status = 'PAYMENT_PENDING'
    `, [studentId, seriesId, centreId]);

    // 6. Notify Super Admin
    await db.query(`
      INSERT INTO test_notifications (recipient_type, title, message, link_url)
      VALUES ('SUPER_ADMIN', 'New Test Series Payment Submitted', ?, '/admin/test-series')
    `, [
      `Student ${student.firstName} ${student.lastName} submitted payment of ₹${series.price} (UTR: ${cleanUtr}) for "${series.title}".`
    ]);

    return {
      success: true,
      paymentId: payResult.insertId,
      message: 'Payment submitted successfully! Super Admin is verifying your UTR reference. Access will be activated upon approval.'
    };
  },

  // ==========================================
  // STUDENT: ONLINE TEST TAKING & SCORING ENGINE
  // ==========================================
  startTestAttempt: async (testId: number | string, studentId: number | string) => {
    // 1. Fetch test and verify series enrollment
    const [tests]: any = await db.query(`
      SELECT t.*, ts.id as series_id, ts.title as series_title, ts.is_free
      FROM tests t
      JOIN test_series ts ON t.test_series_id = ts.id
      WHERE t.id = ? AND t.status = 'LIVE'
    `, [testId]);

    if (tests.length === 0) throw new Error('Test not found or not currently available.');
    const test = tests[0];

    // 2. Check student active enrollment or Elite Pass
    let hasElitePass = false;
    let studentCenterId: number | null = null;
    try {
      const [stuRows]: any = await db.query(
        `SELECT centerId, active_pass_type, pass_expires_at FROM students WHERE id = ?`,
        [studentId]
      );
      if (stuRows.length > 0) {
        studentCenterId = stuRows[0].centerId || null;
        if (stuRows[0].active_pass_type === 'ELITE' && stuRows[0].pass_expires_at) {
          if (new Date(stuRows[0].pass_expires_at).getTime() > Date.now()) {
            hasElitePass = true;
          }
        }
      }
    } catch (_) { }

    if (test.is_free || hasElitePass) {
      await db.query(`
        INSERT INTO test_series_enrollments (student_id, test_series_id, centre_id, enrollment_type, status, expires_at)
        VALUES (?, ?, ?, ?, 'ACTIVE', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 365 DAY))
        ON DUPLICATE KEY UPDATE status = 'ACTIVE'
      `, [studentId, test.series_id, studentCenterId, hasElitePass ? 'ELITE_PASS' : 'FREE']);
    } else {
      const [enrollments]: any = await db.query(`
        SELECT status, expires_at FROM test_series_enrollments
        WHERE student_id = ? AND test_series_id = ?
      `, [studentId, test.series_id]);

      if (enrollments.length === 0 || (enrollments[0].status !== 'ACTIVE' && enrollments[0].status !== 'APPROVED')) {
        throw new Error('Access denied. You must be actively enrolled in this Test Series or hold an active Elite Pass to take tests.');
      }

      if (enrollments[0].expires_at && new Date(enrollments[0].expires_at) < new Date()) {
        throw new Error('Your enrollment for this Test Series has expired.');
      }
    }

    // 3. Check for existing active attempt
    const [activeAttempts]: any = await db.query(`
      SELECT * FROM test_attempts
      WHERE test_id = ? AND student_id = ? AND status = 'IN_PROGRESS'
      ORDER BY id DESC LIMIT 1
    `, [testId, studentId]);

    let attemptId: number;
    let serverEndTime: string;

    if (activeAttempts.length > 0) {
      attemptId = activeAttempts[0].id;
      serverEndTime = activeAttempts[0].server_end_time;
    } else {
      // Create new attempt
      const durationMin = test.duration_minutes || 60;
      const [attRes]: any = await db.query(`
        INSERT INTO test_attempts (
          student_id, test_id, test_series_id, started_at,
          server_end_time, status, total_questions
        ) VALUES (
          ?, ?, ?, CURRENT_TIMESTAMP,
          DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? MINUTE), 'IN_PROGRESS', ?
        )
      `, [studentId, testId, test.series_id, durationMin, test.question_count || 0]);

      attemptId = attRes.insertId;
      const [newAtt]: any = await db.query('SELECT server_end_time FROM test_attempts WHERE id = ?', [attemptId]);
      serverEndTime = newAtt[0].server_end_time;
    }

    // 4. Fetch questions and options WITHOUT revealing is_correct to prevent client inspection tampering
    const [questions]: any = await db.query(`
      SELECT id, test_id, question_text, section_name, question_type, image_url, metadata, marks, negative_marks, display_order
      FROM questions
      WHERE test_id = ?
      ORDER BY display_order ASC, id ASC
    `, [testId]);

    const questionIds = questions.map((q: any) => q.id);
    if (questionIds.length > 0) {
      const [allOptions]: any = await db.query(`
        SELECT id, question_id, option_key, option_text, image_url
        FROM question_options
        WHERE question_id IN (?)
        ORDER BY option_key ASC
      `, [questionIds]);

      const optMap = new Map<number, any[]>();
      for (const opt of allOptions) {
        const qId = Number(opt.question_id);
        if (!optMap.has(qId)) optMap.set(qId, []);
        optMap.get(qId)!.push(opt);
      }

      // Seeded pseudo-random generator so questions and options shuffle dynamically per attempt/retake,
      // but remain 100% consistent if the student refreshes the browser during the same attempt.
      const createPrng = (seed: number) => {
        let s = (seed * 9301 + 49297) % 233280;
        return () => {
          s = (s * 9301 + 49297) % 233280;
          return s / 233280;
        };
      };
      const rng = createPrng(Number(attemptId) || 1);

      // 1. Shuffle questions order for this attempt
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }

      // 2. Shuffle options for each question and assign clean A, B, C, D display keys
      const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
      for (const q of questions) {
        const opts = optMap.get(Number(q.id)) || [];
        for (let i = opts.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          [opts[i], opts[j]] = [opts[j], opts[i]];
        }
        opts.forEach((o: any, idx: number) => {
          o.option_key = optionLetters[idx] || String.fromCharCode(65 + idx);
        });
        q.options = opts;
      }
    } else {
      for (const q of questions) {
        q.options = [];
      }
    }

    // Fetch any previously saved answers for this active attempt
    const [savedAnswers]: any = await db.query(`
      SELECT question_id, selected_option_key, is_marked_for_review FROM test_answers WHERE attempt_id = ?
    `, [attemptId]);

    return {
      attemptId,
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        durationMinutes: test.duration_minutes,
        totalMarks: test.total_marks,
        negativeMarks: test.negative_marks,
        passingMarks: test.passing_marks
      },
      serverEndTime,
      questions,
      savedAnswers
    };
  },

  submitTestAttempt: async (data: {
    attemptId: number | string;
    studentId: number | string;
    answers: Array<any>;
  }) => {
    const { attemptId, studentId, answers } = data;

    // 1. Fetch attempt
    const [attempts]: any = await db.query(`
      SELECT ta.*, t.total_marks, t.passing_marks, t.title as test_title, t.duration_minutes
      FROM test_attempts ta
      JOIN tests t ON ta.test_id = t.id
      WHERE ta.id = ? AND ta.student_id = ?
    `, [attemptId, studentId]);

    if (attempts.length === 0) throw new Error('Test attempt not found.');
    const attempt = attempts[0];

    // If already submitted, return existing scorecard
    if (attempt.status === 'SUBMITTED' || attempt.status === 'AUTO_SUBMITTED') {
      return await testSeriesService.getScorecard(attemptId, studentId);
    }

    // 2. Fetch all questions and their correct answers from database
    const [dbQuestions]: any = await db.query(`
      SELECT q.id, q.marks, q.negative_marks, qo.option_key as correct_key
      FROM questions q
      LEFT JOIN question_options qo ON q.id = qo.question_id AND qo.is_correct = TRUE
      WHERE q.test_id = ?
    `, [attempt.test_id]);

    // Fetch all options for this test to resolve option IDs to option keys
    const [allTestOptions]: any = await db.query(`
      SELECT qo.id, qo.question_id, qo.option_key, qo.is_correct
      FROM question_options qo
      JOIN questions q ON qo.question_id = q.id
      WHERE q.test_id = ?
    `, [attempt.test_id]);

    const optionsByQuestion = new Map<number, any[]>();
    for (const opt of allTestOptions) {
      const qId = Number(opt.question_id);
      if (!optionsByQuestion.has(qId)) optionsByQuestion.set(qId, []);
      optionsByQuestion.get(qId)!.push(opt);
    }

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let marksObtained = 0;
    let negativeApplied = 0;

    const answerMap = new Map();
    if (Array.isArray(answers)) {
      answers.forEach(a => {
        const qId = Number(a.questionId || a.question_id || a.id);
        if (!isNaN(qId) && qId > 0) {
          answerMap.set(qId, a);
        }
      });
    }

    const answersToUpsert: any[] = [];
    // Evaluate each question on server
    for (const q of dbQuestions) {
      const qId = Number(q.id);
      const studentAns = answerMap.get(qId);
      const qOptions = optionsByQuestion.get(qId) || [];

      // Determine selected option and correctness
      const optId = Number(studentAns?.selectedOptionId || studentAns?.selected_option_id || studentAns?.optionId || studentAns?.option_id);
      let selectedKey: string | null = studentAns?.selectedOptionKey || studentAns?.selected_option_key || studentAns?.optionKey || studentAns?.option_key || null;
      const isMarked = Boolean(studentAns?.isMarkedForReview || studentAns?.is_marked_for_review);
      const timeSpent = Number(studentAns?.timeSpentSeconds || studentAns?.time_spent_seconds || 0);
      let isCorrect = false;

      if (!isNaN(optId) && optId > 0) {
        const matched = qOptions.find((o: any) => Number(o.id) === optId);
        if (matched) {
          selectedKey = matched.option_key;
          if (matched.is_correct === 1 || matched.is_correct === true || String(matched.is_correct) === '1') {
            isCorrect = true;
          }
        }
      }

      if (!selectedKey && (!optId || isNaN(optId))) {
        unansweredCount++;
      } else if (isCorrect || (selectedKey && String(selectedKey).trim().toUpperCase() === String(q.correct_key).trim().toUpperCase())) {
        isCorrect = true;
        correctCount++;
        marksObtained += Number(q.marks || 2.0);
      } else {
        incorrectCount++;
        negativeApplied += Number(q.negative_marks || 0.5);
      }

      answersToUpsert.push([attemptId, q.id, selectedKey || null, isCorrect ? 1 : 0, isMarked ? 1 : 0, timeSpent]);
    }

    // High performance bulk upsert in a single query (instant execution for 100+ questions)
    if (answersToUpsert.length > 0) {
      await db.query(`
        INSERT INTO test_answers (attempt_id, question_id, selected_option_key, is_correct, is_marked_for_review, time_spent_seconds)
        VALUES ?
        ON DUPLICATE KEY UPDATE
          selected_option_key = VALUES(selected_option_key),
          is_correct = VALUES(is_correct),
          is_marked_for_review = VALUES(is_marked_for_review),
          time_spent_seconds = VALUES(time_spent_seconds)
      `, [answersToUpsert]);
    }

    const finalScore = Math.max(0, marksObtained - negativeApplied);
    const totalPossibleMarks = Number(attempt.total_marks) || (dbQuestions.length * 2);
    const percentage = totalPossibleMarks > 0 ? (finalScore / totalPossibleMarks) * 100 : 0;
    const attemptedCount = correctCount + incorrectCount;
    const accuracy = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;

    // Calculate dynamic rank
    const [betterAttempts]: any = await db.query(`
      SELECT COUNT(*) as cnt FROM test_attempts
      WHERE test_id = ? AND final_score > ? AND status IN ('SUBMITTED', 'AUTO_SUBMITTED')
    `, [attempt.test_id, finalScore]);
    const dynamicRank = (betterAttempts[0]?.cnt || 0) + 1;

    // 3. Calculate accurate duration directly via MySQL TIMESTAMPDIFF to eliminate timezone offset issues
    const maxDurationSec = Math.max(60, (Number(attempt.duration_minutes) || 60) * 60);
    const [diffResult]: any = await db.query(`
      SELECT GREATEST(1, LEAST(?, TIMESTAMPDIFF(SECOND, started_at, CURRENT_TIMESTAMP))) as duration_sec
      FROM test_attempts
      WHERE id = ?
    `, [maxDurationSec, attemptId]);
    const durationSeconds = Number(diffResult[0]?.duration_sec) || 60;

    await db.query(`
      UPDATE test_attempts
      SET status = 'SUBMITTED',
          submitted_at = CURRENT_TIMESTAMP,
          duration_seconds = ?,
          total_questions = ?,
          correct_answers = ?,
          incorrect_answers = ?,
          unanswered = ?,
          marks_obtained = ?,
          negative_marks_applied = ?,
          final_score = ?,
          percentage = ?,
          accuracy = ?,
          ranking = ?
      WHERE id = ?
    `, [
      durationSeconds,
      dbQuestions.length,
      correctCount,
      incorrectCount,
      unansweredCount,
      marksObtained,
      negativeApplied,
      finalScore,
      percentage,
      accuracy,
      dynamicRank,
      attemptId
    ]);

    // 4. Achievement Star Rules Evaluation
    const [completedTests]: any = await db.query(`
      SELECT COUNT(DISTINCT test_id) as cnt FROM test_attempts
      WHERE student_id = ? AND status = 'SUBMITTED'
    `, [studentId]);
    const totalCompleted = completedTests[0]?.cnt || 1;

    // Check rules
    const [rules]: any = await db.query('SELECT * FROM achievement_rules WHERE status = "ACTIVE"');
    for (const rule of rules) {
      let isUnlocked = false;
      if (rule.criteria_type === 'TESTS_COMPLETED' && totalCompleted >= Number(rule.threshold_value)) {
        isUnlocked = true;
      } else if (rule.criteria_type === 'SCORE_PERCENTAGE' && percentage >= Number(rule.threshold_value)) {
        isUnlocked = true;
      }

      if (isUnlocked) {
        await db.query(`
          INSERT IGNORE INTO student_achievements (student_id, rule_id)
          VALUES (?, ?)
        `, [studentId, rule.id]);
      }
    }

    return await testSeriesService.getScorecard(attemptId, studentId);
  },

  getScorecard: async (attemptId: number | string, studentId: number | string) => {
    const [attempts]: any = await db.query(`
      SELECT 
        ta.*,
        t.title as test_title,
        t.description as test_description,
        t.total_marks as test_total_marks,
        t.passing_marks as test_passing_marks,
        t.duration_minutes as test_duration,
        ts.title as test_series_title,
        s.firstName as student_first_name,
        s.lastName as student_last_name,
        s.enrollment_no,
        COALESCE(cntr.name, 'National Portal') as centre_name
      FROM test_attempts ta
      JOIN tests t ON ta.test_id = t.id
      JOIN test_series ts ON ta.test_series_id = ts.id
      JOIN students s ON ta.student_id = s.id
      LEFT JOIN centers cntr ON s.centerId = cntr.id
      WHERE ta.id = ? AND ta.student_id = ?
    `, [attemptId, studentId]);

    if (attempts.length === 0) throw new Error('Scorecard not found.');
    const attempt = attempts[0];

    // Fetch detailed question analysis with correct options and explanations
    const [questions]: any = await db.query(`
      SELECT 
        q.id,
        q.question_text,
        q.question_type,
        q.image_url,
        q.metadata,
        q.section_name,
        q.explanation,
        q.marks,
        q.negative_marks,
        ta.selected_option_key,
        ta.is_correct as student_is_correct,
        ta.time_spent_seconds
      FROM questions q
      LEFT JOIN test_answers ta ON q.id = ta.question_id AND ta.attempt_id = ?
      WHERE q.test_id = ?
      ORDER BY q.display_order ASC, q.id ASC
    `, [attemptId, attempt.test_id]);

    const scorecardQIds = questions.map((q: any) => q.id);
    if (scorecardQIds.length > 0) {
      const [allOptions]: any = await db.query(`
        SELECT id, question_id, option_key, option_text, image_url, is_correct
        FROM question_options
        WHERE question_id IN (?)
        ORDER BY option_key ASC
      `, [scorecardQIds]);

      const optMap = new Map<number, any[]>();
      for (const opt of allOptions) {
        const qId = Number(opt.question_id);
        if (!optMap.has(qId)) optMap.set(qId, []);
        optMap.get(qId)!.push(opt);
      }

      for (const q of questions) {
        q.options = optMap.get(Number(q.id)) || [];
      }
    } else {
      for (const q of questions) {
        q.options = [];
      }
    }

    // Fetch earned achievements
    const [achievements]: any = await db.query(`
      SELECT ar.*, sa.earned_at
      FROM student_achievements sa
      JOIN achievement_rules ar ON sa.rule_id = ar.id
      WHERE sa.student_id = ?
      ORDER BY sa.earned_at DESC
    `, [studentId]);

    // Determine pass / fail status
    const passingMarks = Number(attempt.test_passing_marks || attempt.passing_marks || 40);
    const isPassed = Number(attempt.final_score || 0) >= passingMarks;
    attempt.is_passed = isPassed;
    attempt.pass_status = isPassed ? 'PASSED' : 'FAILED';
    attempt.passing_marks = passingMarks;

    // Query historical attempts for this test & student to calculate improvement vs previous attempt
    const [allAttempts]: any = await db.query(`
      SELECT 
        id,
        final_score,
        percentage,
        accuracy,
        correct_answers,
        incorrect_answers,
        unanswered,
        duration_seconds,
        ranking,
        submitted_at,
        started_at
      FROM test_attempts
      WHERE student_id = ? AND test_id = ? AND status IN ('SUBMITTED', 'AUTO_SUBMITTED')
      ORDER BY submitted_at ASC, id ASC
    `, [studentId, attempt.test_id]);

    const attemptsList = allAttempts || [];
    const currentIdx = attemptsList.findIndex((a: any) => Number(a.id) === Number(attemptId));
    const prevAttempt = currentIdx > 0 ? attemptsList[currentIdx - 1] : null;

    const attemptsHistory = attemptsList.map((a: any, index: number) => ({
      attempt_number: index + 1,
      id: Number(a.id),
      final_score: Number(a.final_score || 0),
      percentage: Number(a.percentage || 0),
      accuracy: Number(a.accuracy || 0),
      duration_seconds: Number(a.duration_seconds || 0),
      correct_answers: Number(a.correct_answers || 0),
      incorrect_answers: Number(a.incorrect_answers || 0),
      unanswered: Number(a.unanswered || 0),
      submitted_at: a.submitted_at || a.started_at,
      is_current: Number(a.id) === Number(attemptId)
    }));

    const scoreDiff = prevAttempt ? Number((Number(attempt.final_score || 0) - Number(prevAttempt.final_score || 0)).toFixed(2)) : 0;
    const percentageDiff = prevAttempt ? Number((Number(attempt.percentage || 0) - Number(prevAttempt.percentage || 0)).toFixed(2)) : 0;
    const accuracyDiff = prevAttempt ? Number((Number(attempt.accuracy || 0) - Number(prevAttempt.accuracy || 0)).toFixed(2)) : 0;
    const timeDiffSeconds = prevAttempt ? (Number(prevAttempt.duration_seconds || 0) - Number(attempt.duration_seconds || 0)) : 0;

    let improvementStatus: 'FIRST_ATTEMPT' | 'IMPROVED' | 'DECLINED' | 'SAME' = 'FIRST_ATTEMPT';
    if (prevAttempt) {
      if (scoreDiff > 0 || (scoreDiff === 0 && percentageDiff > 0)) {
        improvementStatus = 'IMPROVED';
      } else if (scoreDiff < 0 || percentageDiff < 0) {
        improvementStatus = 'DECLINED';
      } else {
        improvementStatus = 'SAME';
      }
    }

    const comparison = {
      attempt_number: currentIdx >= 0 ? currentIdx + 1 : attemptsList.length || 1,
      total_attempts: attemptsList.length || 1,
      has_previous: Boolean(prevAttempt),
      previous_attempt: prevAttempt ? {
        id: prevAttempt.id,
        final_score: Number(prevAttempt.final_score || 0),
        percentage: Number(prevAttempt.percentage || 0),
        accuracy: Number(prevAttempt.accuracy || 0),
        duration_seconds: Number(prevAttempt.duration_seconds || 0),
        submitted_at: prevAttempt.submitted_at || prevAttempt.started_at
      } : null,
      score_diff: scoreDiff,
      percentage_diff: percentageDiff,
      accuracy_diff: accuracyDiff,
      time_diff_seconds: timeDiffSeconds,
      improvement_status: improvementStatus,
      attempts_history: attemptsHistory
    };

    attempt.comparison = comparison;
    attempt.attempts_history = attemptsHistory;

    return {
      attempt,
      questions,
      achievements,
      comparison
    };
  },

  getStudentAnalyticsAndStars: async (studentId: number | string) => {
    // 1. Attempts summary
    const [attempts]: any = await db.query(`
      SELECT 
        ta.*,
        t.title as test_title,
        ts.title as test_series_title
      FROM test_attempts ta
      JOIN tests t ON ta.test_id = t.id
      JOIN test_series ts ON ta.test_series_id = ts.id
      WHERE ta.student_id = ? AND ta.status = 'SUBMITTED'
      ORDER BY ta.submitted_at DESC
    `, [studentId]);

    // 2. Aggregate stats
    const [agg]: any = await db.query(`
      SELECT 
        COUNT(*) as total_attempts,
        COALESCE(AVG(final_score), 0) as avg_score,
        COALESCE(MAX(final_score), 0) as max_score,
        COALESCE(AVG(accuracy), 0) as avg_accuracy,
        COALESCE(AVG(percentage), 0) as avg_percentage
      FROM test_attempts
      WHERE student_id = ? AND status = 'SUBMITTED'
    `, [studentId]);

    // 3. Achievements (Earned vs Locked)
    const [allRules]: any = await db.query('SELECT * FROM achievement_rules WHERE status = "ACTIVE" ORDER BY star_count ASC');
    const [earned]: any = await db.query('SELECT rule_id, earned_at FROM student_achievements WHERE student_id = ?', [studentId]);
    const earnedMap = new Map();
    earned.forEach((e: any) => earnedMap.set(e.rule_id, e.earned_at));

    const stars = allRules.map((r: any) => ({
      ...r,
      is_unlocked: earnedMap.has(r.id),
      earned_at: earnedMap.get(r.id) || null
    }));

    return {
      stats: {
        testsAttempted: agg[0]?.total_attempts || 0,
        averageScore: Number(agg[0]?.avg_score || 0).toFixed(1),
        highestScore: Number(agg[0]?.max_score || 0).toFixed(1),
        averageAccuracy: Number(agg[0]?.avg_accuracy || 0).toFixed(1),
        averagePercentage: Number(agg[0]?.avg_percentage || 0).toFixed(1)
      },
      attempts,
      stars
    };
  },

  /**
   * Automatically purge/delete test records for students whose test series enrollment / course has expired,
   * provided they do not have an active VIP Pass.
   */
  purgeExpiredStudentTestRecords: async (studentId?: number | string) => {
    try {
      let query = `
        SELECT ta.id as attempt_id
        FROM test_attempts ta
        JOIN test_series_enrollments tse ON ta.test_series_id = tse.test_series_id AND ta.student_id = tse.student_id
        JOIN students s ON ta.student_id = s.id
        WHERE tse.expires_at < CURRENT_TIMESTAMP
          AND (s.pass_expires_at IS NULL OR s.pass_expires_at < CURRENT_TIMESTAMP)
      `;
      const params: any[] = [];
      if (studentId) {
        query += ` AND ta.student_id = ?`;
        params.push(studentId);
      }

      const [expiredRecords]: any = await db.query(query, params);
      if (expiredRecords && expiredRecords.length > 0) {
        const attemptIds = expiredRecords.map((r: any) => r.attempt_id);
        await db.query(`DELETE FROM test_answers WHERE attempt_id IN (?)`, [attemptIds]);
        await db.query(`DELETE FROM test_attempts WHERE id IN (?)`, [attemptIds]);
        console.log(`[Lifecycle] Purged ${attemptIds.length} expired test records for expired enrollments.`);
        return { purged_count: attemptIds.length };
      }
      return { purged_count: 0 };
    } catch (err: any) {
      console.error('[Lifecycle] purgeExpiredStudentTestRecords error:', err.message);
      return { purged_count: 0, error: err.message };
    }
  }
};

