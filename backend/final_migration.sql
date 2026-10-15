-- MySQL dump 10.13  Distrib 9.6.0, for macos26.3 (arm64)
--
-- Host: 127.0.0.1    Database: e2
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `achievement_rules`
--

DROP TABLE IF EXISTS `achievement_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `achievement_rules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `badge_code` varchar(50) NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text NOT NULL,
  `star_count` int DEFAULT '1',
  `icon` varchar(50) DEFAULT 'Star',
  `criteria_type` enum('TESTS_COMPLETED','SCORE_PERCENTAGE','WEEKLY_STREAK','SERIES_COMPLETED') NOT NULL,
  `threshold_value` decimal(10,2) NOT NULL,
  `status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `badge_code` (`badge_code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'superadmin',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_type` varchar(20) NOT NULL,
  `user_id` int DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` varchar(50) DEFAULT NULL,
  `details` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_type`,`user_id`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `center_courses`
--

DROP TABLE IF EXISTS `center_courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `center_courses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `centerId` int NOT NULL,
  `courseId` int NOT NULL,
  `added_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_center_course` (`centerId`,`courseId`),
  KEY `courseId` (`courseId`),
  CONSTRAINT `center_courses_ibfk_1` FOREIGN KEY (`centerId`) REFERENCES `centers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `center_courses_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `center_material_distributions`
--

DROP TABLE IF EXISTS `center_material_distributions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `center_material_distributions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `material_id` int NOT NULL,
  `center_id` int NOT NULL,
  `distributed_by` varchar(100) DEFAULT 'center_admin',
  `distribution_type` enum('ALL_STUDENTS','COURSE_SPECIFIC') DEFAULT 'ALL_STUDENTS',
  `course_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_dist` (`material_id`,`center_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `center_material_purchases`
--

DROP TABLE IF EXISTS `center_material_purchases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `center_material_purchases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `material_id` int NOT NULL,
  `center_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payment_mode` varchar(50) DEFAULT 'WALLET',
  `utr_number` varchar(100) DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'APPROVED',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `centers`
--

DROP TABLE IF EXISTS `centers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `centers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `center_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wallet_balance` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `head_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT 'Center Director',
  `head_image_url` longtext COLLATE utf8mb4_unicode_ci,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Main Road',
  `address_line2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Delhi',
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'New Delhi-110001',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `district` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'New Delhi',
  `pincode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '110001',
  `joined_date` date DEFAULT NULL,
  `logo_url` longtext COLLATE utf8mb4_unicode_ci,
  `custom_pricing_config` json DEFAULT NULL,
  `signature_url` text COLLATE utf8mb4_unicode_ci,
  `stamp_url` text COLLATE utf8mb4_unicode_ci,
  `old_student_allowed_until` datetime DEFAULT NULL,
  `certificate_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `certificate_issued_date` date DEFAULT NULL,
  `certificate_valid_until` date DEFAULT NULL,
  `certificate_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'unclaimed',
  `certificate_claim_date` datetime DEFAULT NULL,
  `certificate_approved_date` datetime DEFAULT NULL,
  `certificate_demand_notes` text COLLATE utf8mb4_unicode_ci,
  `certificate_demanded_docs` text COLLATE utf8mb4_unicode_ci,
  `certificate_uploaded_docs` longtext COLLATE utf8mb4_unicode_ci,
  `certificate_file_url` longtext COLLATE utf8mb4_unicode_ci,
  `certificate_s3_url` longtext COLLATE utf8mb4_unicode_ci,
  `token_version` int DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `center_code` (`center_code`),
  KEY `idx_centers_code` (`center_code`),
  KEY `idx_centers_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contact_queries`
--

DROP TABLE IF EXISTS `contact_queries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_queries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inquiry_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Course Admission',
  `course` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `admin_notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_questions`
--

DROP TABLE IF EXISTS `course_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `courseId` int NOT NULL,
  `semester` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'SEM 1',
  `question` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `optA` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `optB` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `optC` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `optD` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `correct` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `marks` int DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `courseId` (`courseId`),
  CONSTRAINT `course_questions_ibfk_1` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoryId` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fee` decimal(10,2) DEFAULT NULL,
  `shortDescription` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `duration` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '3 Month(s)',
  `semesters` json DEFAULT NULL,
  `created_by_type` enum('admin','center') COLLATE utf8mb4_unicode_ci DEFAULT 'admin',
  `created_by_id` int DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT '1',
  `is_draft` tinyint(1) DEFAULT '0',
  `image_url` longtext COLLATE utf8mb4_unicode_ci,
  `eligibility` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT '10th / 12th Pass',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exams`
--

DROP TABLE IF EXISTS `exams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `centerId` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `franchise_applications`
--

DROP TABLE IF EXISTS `franchise_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `franchise_applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `center_head_first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `center_head_middle_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `center_head_last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `father_first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `father_middle_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father_last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `aadhar_number` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pan_number` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dob` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `marital_status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `center_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address_line1` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address_line2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `district` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pincode` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `photo_url` longtext COLLATE utf8mb4_unicode_ci,
  `signature_url` longtext COLLATE utf8mb4_unicode_ci,
  `marksheet_url` longtext COLLATE utf8mb4_unicode_ci,
  `aadhar_front_url` longtext COLLATE utf8mb4_unicode_ci,
  `aadhar_back_url` longtext COLLATE utf8mb4_unicode_ci,
  `center_photos_url` longtext COLLATE utf8mb4_unicode_ci,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `qualification` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Graduate',
  `certificate_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'unclaimed',
  `certificate_claim_date` datetime DEFAULT NULL,
  `certificate_approved_date` datetime DEFAULT NULL,
  `certificate_demand_notes` text COLLATE utf8mb4_unicode_ci,
  `certificate_demanded_docs` text COLLATE utf8mb4_unicode_ci,
  `certificate_uploaded_docs` longtext COLLATE utf8mb4_unicode_ci,
  `center_id` int DEFAULT NULL,
  `center_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `certificate_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `login_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proposed_password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `free_test_access_logs`
--

DROP TABLE IF EXISTS `free_test_access_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `free_test_access_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `test_id` int NOT NULL,
  `test_uid` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `student_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `student_roll` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `student_mobile` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `student_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `device_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'opened',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_test_id` (`test_id`),
  KEY `idx_ip` (`ip_address`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `free_test_questions`
--

DROP TABLE IF EXISTS `free_test_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `free_test_questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `testId` int NOT NULL,
  `question` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `optA` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `optB` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `optC` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `optD` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `correct` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `marks` decimal(5,2) DEFAULT '1.00',
  PRIMARY KEY (`id`),
  KEY `testId` (`testId`),
  CONSTRAINT `free_test_questions_ibfk_1` FOREIGN KEY (`testId`) REFERENCES `free_tests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `free_test_submissions`
--

DROP TABLE IF EXISTS `free_test_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `free_test_submissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `test_id` int NOT NULL,
  `center_id` int DEFAULT NULL,
  `student_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_roll` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `student_mobile` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `student_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `score` decimal(5,2) DEFAULT '0.00',
  `total_marks` int DEFAULT '0',
  `correct_count` int DEFAULT '0',
  `wrong_count` int DEFAULT '0',
  `unanswered_count` int DEFAULT '0',
  `percentage` decimal(5,2) DEFAULT '0.00',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Completed',
  `time_taken_seconds` int DEFAULT '0',
  `responses_json` longtext COLLATE utf8mb4_unicode_ci,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `student_id_card` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_cheating` tinyint(1) DEFAULT '0',
  `ip_address` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `device_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Desktop',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `free_tests`
--

DROP TABLE IF EXISTS `free_tests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `free_tests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `centerId` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_published` tinyint(1) DEFAULT '0',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `test_uid` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration_minutes` int DEFAULT '30',
  `auto_submit` tinyint(1) DEFAULT '1',
  `pass_marks` int DEFAULT '40',
  `total_marks` int DEFAULT '100',
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'General',
  `student_limit` int DEFAULT '50',
  `views` int DEFAULT '0',
  `has_been_published` tinyint(1) DEFAULT '0',
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gallery`
--

DROP TABLE IF EXISTS `gallery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gallery` (
  `id` int NOT NULL AUTO_INCREMENT,
  `image_url` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `caption` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_type` enum('admin','center','student') COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `expiry_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user_read` (`user_type`,`user_id`,`is_read`),
  KEY `idx_notif_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `question_options`
--

DROP TABLE IF EXISTS `question_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `question_options` (
  `id` int NOT NULL AUTO_INCREMENT,
  `question_id` int NOT NULL,
  `option_key` varchar(10) NOT NULL,
  `option_text` text NOT NULL,
  `is_correct` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `question_options_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9241 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions`
--

DROP TABLE IF EXISTS `questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `test_id` int NOT NULL,
  `question_text` text NOT NULL,
  `section_name` varchar(100) DEFAULT 'General Assessment',
  `question_type` enum('SINGLE_CHOICE','MULTIPLE_CHOICE','TRUE_FALSE') DEFAULT 'SINGLE_CHOICE',
  `explanation` text,
  `marks` decimal(5,2) DEFAULT '2.00',
  `negative_marks` decimal(4,2) DEFAULT '0.50',
  `display_order` int DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `test_id` (`test_id`),
  CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`test_id`) REFERENCES `tests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2311 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` json NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key_name` (`key_name`)
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_achievements`
--

DROP TABLE IF EXISTS `student_achievements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_achievements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `rule_id` int NOT NULL,
  `earned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_student_badge` (`student_id`,`rule_id`),
  KEY `rule_id` (`rule_id`),
  CONSTRAINT `student_achievements_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_achievements_ibfk_2` FOREIGN KEY (`rule_id`) REFERENCES `achievement_rules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_marks`
--

DROP TABLE IF EXISTS `student_marks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_marks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `studentId` int NOT NULL,
  `semester` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `written_marks` decimal(10,2) DEFAULT '0.00',
  `viva_marks` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `exam_date` date DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'scheduled',
  `responses_json` longtext COLLATE utf8mb4_unicode_ci,
  `total_questions` int DEFAULT '0',
  `correct_answers` int DEFAULT '0',
  `wrong_answers` int DEFAULT '0',
  `reattempts` int DEFAULT '0',
  `is_marksheet_generated` tinyint(1) DEFAULT '0',
  `is_published_to_student` tinyint(1) DEFAULT '1',
  `dues_cleared` tinyint(1) DEFAULT '1',
  `hold_reason` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_semester` (`studentId`,`semester`),
  KEY `idx_student_marks_student` (`studentId`,`exam_date`),
  CONSTRAINT `student_marks_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `firstName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lastName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `courseId` int DEFAULT NULL,
  `centerId` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `student_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'new',
  `duration` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '1-3 months',
  `tokens_deducted` decimal(10,2) DEFAULT '0.00',
  `certificate_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'not_generated',
  `certificate_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dob` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `marital_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mother_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qualification` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `pincode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `course_fee` decimal(10,2) DEFAULT '0.00',
  `session_start` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `session_end` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo_url` longtext COLLATE utf8mb4_unicode_ci,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `academic_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'pursuing',
  `enrollment_no` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `roll_no` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_card_url` longtext COLLATE utf8mb4_unicode_ci,
  `marksheet_url` longtext COLLATE utf8mb4_unicode_ci,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '123456',
  `certificate_file_url` longtext COLLATE utf8mb4_unicode_ci,
  `certificate_s3_url` longtext COLLATE utf8mb4_unicode_ci,
  `marksheet_file_url` longtext COLLATE utf8mb4_unicode_ci,
  `marksheet_s3_url` longtext COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_students_email_pwd` (`email`,`password`),
  KEY `idx_students_enrollment_no` (`enrollment_no`),
  KEY `idx_students_created_at` (`created_at`),
  KEY `idx_students_center_status` (`centerId`,`status`),
  KEY `idx_students_roll_no` (`roll_no`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`centerId`) REFERENCES `centers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `study_material_analytics`
--

DROP TABLE IF EXISTS `study_material_analytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `study_material_analytics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `material_id` int NOT NULL,
  `student_id` int DEFAULT NULL,
  `session_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `view_type` enum('DEMO','FULL') COLLATE utf8mb4_unicode_ci DEFAULT 'FULL',
  `read_time_seconds` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `study_material_categories`
--

DROP TABLE IF EXISTS `study_material_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `study_material_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `study_material_centres`
--

DROP TABLE IF EXISTS `study_material_centres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `study_material_centres` (
  `id` int NOT NULL AUTO_INCREMENT,
  `material_id` int NOT NULL,
  `centre_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_mat_centre` (`material_id`,`centre_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `study_material_purchases`
--

DROP TABLE IF EXISTS `study_material_purchases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `study_material_purchases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `material_id` int NOT NULL,
  `student_id` int NOT NULL,
  `centre_id` int DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payment_mode` varchar(50) DEFAULT 'UPI',
  `utr_number` varchar(100) DEFAULT NULL,
  `screenshot_url` varchar(500) DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  `rejection_reason` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `study_materials`
--

DROP TABLE IF EXISTS `study_materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `study_materials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT 'General',
  `description` text,
  `thumbnail_url` text,
  `file_url` varchar(500) DEFAULT NULL,
  `file_type` varchar(50) DEFAULT 'PDF',
  `file_size` varchar(50) DEFAULT '2.5 MB',
  `content_text` longtext,
  `is_free` tinyint(1) DEFAULT '1',
  `price` decimal(10,2) DEFAULT '0.00',
  `center_price` decimal(10,2) DEFAULT '0.00',
  `student_price` decimal(10,2) DEFAULT '0.00',
  `payment_qr_id` int DEFAULT NULL,
  `publish_scope` enum('ALL_CENTRES','SELECTED_CENTRES','ENROLLED_STUDENTS') DEFAULT 'ALL_CENTRES',
  `target_audience` enum('CENTER_PURCHASE','STUDENT_DIRECT','BOTH') DEFAULT 'STUDENT_DIRECT',
  `course_id` int DEFAULT NULL,
  `status` enum('DRAFT','SCHEDULED','PUBLISHED','ARCHIVED','PENDING_APPROVAL') DEFAULT 'PUBLISHED',
  `scheduled_publish_time` datetime DEFAULT NULL,
  `watermark_enabled` tinyint(1) DEFAULT '1',
  `created_by_type` enum('admin','center') DEFAULT 'admin',
  `created_by_id` int DEFAULT NULL,
  `downloads_count` int DEFAULT '0',
  `views_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `center_distribute_price` decimal(10,2) DEFAULT '20.00',
  PRIMARY KEY (`id`),
  KEY `idx_study_mat_cat_status` (`category`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `superadmin_test_series`
--

DROP TABLE IF EXISTS `superadmin_test_series`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `superadmin_test_series` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `type` enum('free','paid') COLLATE utf8mb4_unicode_ci DEFAULT 'free',
  `price` decimal(10,2) DEFAULT '0.00',
  `status` enum('draft','published') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_superadmin_test_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `superadmin_test_series_questions`
--

DROP TABLE IF EXISTS `superadmin_test_series_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `superadmin_test_series_questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `series_id` int NOT NULL,
  `question` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `optA` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `optB` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `optC` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `optD` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `correct` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `marks` int DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `series_id` (`series_id`),
  CONSTRAINT `superadmin_test_series_questions_ibfk_1` FOREIGN KEY (`series_id`) REFERENCES `superadmin_test_series` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `test_answers`
--

DROP TABLE IF EXISTS `test_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_answers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `attempt_id` int NOT NULL,
  `question_id` int NOT NULL,
  `selected_option_key` varchar(10) DEFAULT NULL,
  `is_correct` tinyint(1) DEFAULT '0',
  `is_marked_for_review` tinyint(1) DEFAULT '0',
  `time_spent_seconds` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_attempt_question` (`attempt_id`,`question_id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `test_answers_ibfk_1` FOREIGN KEY (`attempt_id`) REFERENCES `test_attempts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `test_answers_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=354 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `test_attempts`
--

DROP TABLE IF EXISTS `test_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `test_id` int NOT NULL,
  `test_series_id` int NOT NULL,
  `attempt_number` int DEFAULT '1',
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `submitted_at` timestamp NULL DEFAULT NULL,
  `server_end_time` timestamp NULL DEFAULT NULL,
  `duration_seconds` int DEFAULT '0',
  `status` enum('IN_PROGRESS','SUBMITTED','AUTO_SUBMITTED','RESET') DEFAULT 'IN_PROGRESS',
  `total_questions` int DEFAULT '0',
  `correct_answers` int DEFAULT '0',
  `incorrect_answers` int DEFAULT '0',
  `unanswered` int DEFAULT '0',
  `marks_obtained` decimal(6,2) DEFAULT '0.00',
  `negative_marks_applied` decimal(6,2) DEFAULT '0.00',
  `final_score` decimal(6,2) DEFAULT '0.00',
  `percentage` decimal(5,2) DEFAULT '0.00',
  `accuracy` decimal(5,2) DEFAULT '0.00',
  `ranking` int DEFAULT '1',
  `reset_reason` text,
  `reset_by` int DEFAULT NULL,
  `reset_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `test_id` (`test_id`),
  KEY `test_series_id` (`test_series_id`),
  CONSTRAINT `test_attempts_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `test_attempts_ibfk_2` FOREIGN KEY (`test_id`) REFERENCES `tests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `test_attempts_ibfk_3` FOREIGN KEY (`test_series_id`) REFERENCES `test_series` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `test_audit_logs`
--

DROP TABLE IF EXISTS `test_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `user_role` varchar(50) DEFAULT 'SUPER_ADMIN',
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` int NOT NULL,
  `details` json DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `test_categories`
--

DROP TABLE IF EXISTS `test_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `slug` varchar(150) NOT NULL,
  `description` text,
  `thumbnail_url` text,
  `icon` varchar(100) DEFAULT 'BookOpen',
  `display_order` int DEFAULT '0',
  `status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `test_notifications`
--

DROP TABLE IF EXISTS `test_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `recipient_type` enum('SUPER_ADMIN','STUDENT') NOT NULL,
  `recipient_id` int DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `link_url` varchar(255) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `test_payment_qr`
--

DROP TABLE IF EXISTS `test_payment_qr`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_payment_qr` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `upi_id` varchar(150) NOT NULL,
  `account_name` varchar(150) NOT NULL,
  `qr_image_url` text NOT NULL,
  `amount` decimal(10,2) DEFAULT '0.00',
  `instructions` text,
  `is_global_default` tinyint(1) DEFAULT '0',
  `status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `test_payments`
--

DROP TABLE IF EXISTS `test_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `test_series_id` int NOT NULL,
  `centre_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'INR',
  `payment_method` varchar(50) DEFAULT 'UPI_QR',
  `utr_number` varchar(100) NOT NULL,
  `payment_screenshot` text,
  `payment_qr_id` int DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED','CANCELLED','REFUNDED') DEFAULT 'PENDING',
  `rejection_reason` text,
  `verified_by` int DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_utr` (`utr_number`),
  KEY `student_id` (`student_id`),
  KEY `test_series_id` (`test_series_id`),
  CONSTRAINT `test_payments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `test_payments_ibfk_2` FOREIGN KEY (`test_series_id`) REFERENCES `test_series` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `test_series`
--

DROP TABLE IF EXISTS `test_series`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_series` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `category_id` int DEFAULT NULL,
  `description` text,
  `thumbnail_url` text,
  `instructions` text,
  `exam_type` varchar(100) DEFAULT 'Mock Test Series',
  `language` varchar(50) DEFAULT 'English + Hindi',
  `difficulty` enum('ALL_LEVELS','BEGINNER','INTERMEDIATE','ADVANCED') DEFAULT 'ALL_LEVELS',
  `total_tests` int DEFAULT '1',
  `price` decimal(10,2) DEFAULT '0.00',
  `is_free` tinyint(1) DEFAULT '1',
  `duration_minutes` int DEFAULT '60',
  `validity_days` int DEFAULT '90',
  `publish_scope` enum('ALL_CENTRES','SELECTED_CENTRES') DEFAULT 'ALL_CENTRES',
  `payment_qr_id` int DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `scheduled_publish_time` datetime DEFAULT NULL,
  `status` enum('DRAFT','PUBLISHED','SCHEDULED','UNPUBLISHED','ARCHIVED') DEFAULT 'DRAFT',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `payment_qr_id` (`payment_qr_id`),
  KEY `idx_test_cat_status` (`category_id`,`status`),
  CONSTRAINT `test_series_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `test_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `test_series_ibfk_2` FOREIGN KEY (`payment_qr_id`) REFERENCES `test_payment_qr` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `test_series_centres`
--

DROP TABLE IF EXISTS `test_series_centres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_series_centres` (
  `id` int NOT NULL AUTO_INCREMENT,
  `test_series_id` int NOT NULL,
  `centre_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_series_centre` (`test_series_id`,`centre_id`),
  KEY `centre_id` (`centre_id`),
  CONSTRAINT `test_series_centres_ibfk_1` FOREIGN KEY (`test_series_id`) REFERENCES `test_series` (`id`) ON DELETE CASCADE,
  CONSTRAINT `test_series_centres_ibfk_2` FOREIGN KEY (`centre_id`) REFERENCES `centers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `test_series_enrollments`
--

DROP TABLE IF EXISTS `test_series_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_series_enrollments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `test_series_id` int NOT NULL,
  `centre_id` int NOT NULL,
  `enrollment_type` enum('FREE','PAID') DEFAULT 'FREE',
  `status` enum('ACTIVE','PAYMENT_PENDING','REJECTED','EXPIRED','SUSPENDED') DEFAULT 'ACTIVE',
  `enrolled_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_student_series` (`student_id`,`test_series_id`),
  KEY `test_series_id` (`test_series_id`),
  CONSTRAINT `test_series_enrollments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `test_series_enrollments_ibfk_2` FOREIGN KEY (`test_series_id`) REFERENCES `test_series` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tests`
--

DROP TABLE IF EXISTS `tests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `test_series_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `question_count` int DEFAULT '0',
  `duration_minutes` int DEFAULT '60',
  `total_marks` decimal(6,2) DEFAULT '100.00',
  `negative_marks` decimal(4,2) DEFAULT '0.25',
  `passing_marks` decimal(6,2) DEFAULT '40.00',
  `release_type` enum('IMMEDIATE','WEEKLY','CUSTOM_DATE','MANUAL') DEFAULT 'IMMEDIATE',
  `release_week` int DEFAULT '1',
  `custom_release_date` datetime DEFAULT NULL,
  `is_released` tinyint(1) DEFAULT '1',
  `status` enum('DRAFT','SCHEDULED','LIVE','COMPLETED','ARCHIVED') DEFAULT 'LIVE',
  `display_order` int DEFAULT '1',
  `payment_qr_id` int DEFAULT NULL,
  `price` decimal(10,2) DEFAULT '0.00',
  `is_free` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `test_series_id` (`test_series_id`),
  KEY `fk_tests_payment_qr` (`payment_qr_id`),
  CONSTRAINT `fk_tests_payment_qr` FOREIGN KEY (`payment_qr_id`) REFERENCES `test_payment_qr` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tests_ibfk_1` FOREIGN KEY (`test_series_id`) REFERENCES `test_series` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `training_videos`
--

DROP TABLE IF EXISTS `training_videos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `training_videos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `duration` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thumbnail` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `youtube_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `module_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Module 01',
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Portal Guide',
  `is_featured` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wallet_requests`
--

DROP TABLE IF EXISTS `wallet_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallet_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `centerId` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `utr_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bonus_tokens` decimal(10,2) DEFAULT '0.00',
  `total_credited` decimal(10,2) DEFAULT '0.00',
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `narration` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Wallet Recharge',
  `rejection_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `centerId` (`centerId`),
  CONSTRAINT `wallet_requests_ibfk_1` FOREIGN KEY (`centerId`) REFERENCES `centers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wallet_transactions`
--

DROP TABLE IF EXISTS `wallet_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallet_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `centerId` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `type` enum('credit','debit') COLLATE utf8mb4_unicode_ci DEFAULT 'credit',
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `txn_uid` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `utr_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Approved',
  `remark` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_wallet_center_created` (`centerId`,`created_at`),
  CONSTRAINT `wallet_transactions_ibfk_1` FOREIGN KEY (`centerId`) REFERENCES `centers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping events for database 'e2'
--

--
-- Dumping routines for database 'e2'
--
--
-- WARNING: can't read the INFORMATION_SCHEMA.libraries table. It's most probably an old server 8.0.46.
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-15  9:16:18


--
-- Dumping data for table `admins` (Super Admin Credentials Only)
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
INSERT INTO `admins` (`id`, `username`, `email`, `password_hash`, `role`, `status`, `created_at`, `updated_at`) VALUES (1, 'devAjay@108', 'devAjay@108', '$2b$10$JVYM/HZJgPjG8JiAtDcdOOFR7Gq6wpYLV1uagTZYh3RG0P3qETs/O', 'superadmin', 'active', NOW(), NOW());
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;
