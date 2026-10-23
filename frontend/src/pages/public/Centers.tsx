import React, { useState, useMemo, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  MapPin,
  Search,
  Phone,
  Mail,
  Navigation,
  CheckCircle2,
  Filter,
  ShieldCheck,
  ExternalLink,
  Users,
  Calendar,
  X,
  Map as MapIcon,
  List,
  Sparkles,
  BookOpen,
  Award,
  Download,
  Cloud
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import { useDebounce } from '../../hooks/useDebounce';

// Lazy-loaded heavy Center Certificate Canvas/PDF modal
const CenterCertificateModal = lazy(() => import('../../components/CenterCertificateModal'));

const INDIAN_STATES = [
  'All States',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
];

interface CenterRecord {
  id: number | string;
  code: string;
  name: string;
  headName: string;
  headImageUrl?: string;
  phone?: string;
  email?: string;
  address: string;
  addressLine2?: string;
  city: string;
  district?: string;
  state: string;
  pincode?: string;
  joinedDate?: string;
  authorizedCourses?: string[];
  status?: string;
}

const FALLBACK_CENTERS: CenterRecord[] = [
  {
    id: 1,
    code: 'EXM-CEN-0101',
    name: 'Examirror Premier Skill & Computer Academy',
    headName: 'Dr. Ramesh Sharma',
    phone: '+91 98765 43210',
    email: 'delhi.central@examirror.edu.in',
    address: 'Plot No. 42, Connaught Place, Outer Circle',
    city: 'New Delhi',
    district: 'Central Delhi',
    state: 'Delhi',
    pincode: '110001',
    joinedDate: '15 Jan 2024',
    authorizedCourses: ['ADCA', 'DCA', 'Tally Prime', 'Full Stack Web', 'CCTV & Hardware'],
    status: 'ACTIVE'
  },
  {
    id: 2,
    code: 'EXM-CEN-0102',
    name: 'Apex Institute of Technical & Vocational Studies',
    headName: 'Er. Rajesh Verma',
    phone: '+91 94140 12345',
    email: 'jaipur.branch@examirror.edu.in',
    address: 'B-12, Tonk Road, Near Gandhi Nagar Station',
    city: 'Jaipur',
    district: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302015',
    joinedDate: '10 Mar 2024',
    authorizedCourses: ['ADCA', 'DCA', 'Smartphone Repairing', 'Fashion & Tailoring'],
    status: 'ACTIVE'
  },
  {
    id: 3,
    code: 'EXM-CEN-0103',
    name: 'National Computer Training & Hardware Center',
    headName: 'Prof. Alok Mukherjee',
    phone: '+91 98300 78910',
    email: 'kolkata.hub@examirror.edu.in',
    address: '77/A, Salt Lake Sector V, Electronics Complex',
    city: 'Kolkata',
    district: 'North 24 Parganas',
    state: 'West Bengal',
    pincode: '700091',
    joinedDate: '01 Jun 2024',
    authorizedCourses: ['Hardware & Networking', 'Full Stack Dev', 'ADCA', 'Tally Prime'],
    status: 'ACTIVE'
  },
  {
    id: 4,
    code: 'EXM-CEN-0104',
    name: 'Vidya Computer & Skill Development Institute',
    headName: 'Smt. Sunita Patel',
    phone: '+91 97230 45678',
    email: 'ahmedabad.center@examirror.edu.in',
    address: '304, CG Road, Navrangpura',
    city: 'Ahmedabad',
    district: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380009',
    joinedDate: '18 Aug 2024',
    authorizedCourses: ['ADCA', 'DCA', 'Tally Prime with GST', 'Tailoring & Stitching'],
    status: 'ACTIVE'
  },
  {
    id: 5,
    code: 'EXM-CEN-0105',
    name: 'Pragati Technical Institute & Digital Hub',
    headName: 'Mohd. Imran Khan',
    phone: '+91 94500 67890',
    email: 'lucknow.branch@examirror.edu.in',
    address: '15/B, Hazratganj Main Market',
    city: 'Lucknow',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    pincode: '226001',
    joinedDate: '05 Nov 2024',
    authorizedCourses: ['ADCA', 'DCA', 'CCTV Maintenance', 'Smartphone Hardware'],
    status: 'ACTIVE'
  },
  {
    id: 6,
    code: 'EXM-CEN-0106',
    name: 'FutureTech Skill & Education Center',
    headName: 'Praveen K. Reddy',
    phone: '+91 98480 33445',
    email: 'hyderabad.hub@examirror.edu.in',
    address: 'Plot 88, Dilsukhnagar Main Road',
    city: 'Hyderabad',
    district: 'Hyderabad',
    state: 'Telangana',
    pincode: '500060',
    joinedDate: '12 Jan 2025',
    authorizedCourses: ['Full Stack Web', 'ADCA', 'Hardware & Networking', 'Tally Prime'],
    status: 'ACTIVE'
  }
];

export const Centers = () => {
  const [selectedState, setSelectedState] = useState('All States');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const [selectedCenterForModal, setSelectedCenterForModal] = useState<CenterRecord | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // TanStack Query for Dynamic Centers from Backend
  const { data: dbCenters, isLoading } = useQuery({
    queryKey: ['publicCentersList'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/public/centers/public');
        if (!response.ok) return null;
        const json = await response.json();
        return json.data || null;
      } catch {
        return null;
      }
    }
  });

  // Normalize center records
  const allCenters = useMemo(() => {
    if (dbCenters && Array.isArray(dbCenters) && dbCenters.length > 0) {
      return dbCenters.map((c: any, index: number) => ({
        id: c.id || index + 1,
        code: c.code || c.center_code || `EXM-CEN-${String(c.id || index + 1).padStart(4, '0')}`,
        name: c.instituteName || c.institute_name || c.name || c.center_name || 'Authorized Study Center',
        headName: c.headName || c.head_name || c.contact_person || 'Center Director',
        phone: c.phone || c.contact_number || '+91 Center Helpdesk',
        email: c.email || 'center.saurabhcsjnu@gmail.com',
        address: c.address || c.address_line1 || 'Main Institutional Area',
        addressLine2: c.addressLine2 || c.address_line2 || '',
        city: c.city || 'District Center',
        district: c.district || c.city || 'District',
        state: c.state || 'Delhi',
        pincode: c.pincode || c.pin_code || '',
        joinedDate: c.joinedDate || c.joined_date ? new Date(c.joinedDate || c.joined_date).toLocaleDateString('en-GB') : 'Verified Partner',
        authorizedCourses: c.authorizedCourses || ['ADCA', 'DCA', 'Tally Prime & GST', 'Technical Certificates'],
        status: c.status || 'ACTIVE'
      } as CenterRecord));
    }
    return FALLBACK_CENTERS;
  }, [dbCenters]);

  // Filtered Centers (Debounced & Memoized)
  const filteredCenters = useMemo(() => {
    const q = debouncedSearchQuery.trim().toLowerCase();
    return allCenters.filter((center) => {
      const matchesState =
        selectedState === 'All States' ||
        center.state.toLowerCase() === selectedState.toLowerCase();

      const matchesQuery =
        !q ||
        center.name.toLowerCase().includes(q) ||
        center.code.toLowerCase().includes(q) ||
        center.city.toLowerCase().includes(q) ||
        (center.district || '').toLowerCase().includes(q) ||
        center.headName.toLowerCase().includes(q);

      return matchesState && matchesQuery;
    });
  }, [allCenters, selectedState, debouncedSearchQuery]);

  // Generate Google Maps URL
  const getDirectionsUrl = (center: CenterRecord) => {
    const query = encodeURIComponent(
      `${center.name}, ${center.address}, ${center.city}, ${center.state} ${center.pincode || ''}`
    );
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  return (
    <div className="flex flex-col w-full bg-slate-50 min-h-screen">
      <SEO
        title="Authorized Study Centers | Examirror Branches"
        description="Locate Examirror's authorized computer education study centers and franchisee branches across India. Verify center codes, contact details, and locations."
        keywords={[
          'Examirror Centers',
          'Computer Institute Franchise Branches',
          'Authorized Study Center Network',
          'Computer Training Center Near Me',
          'ISO Certified Institute Branches'
        ]}
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Authorized Centers', item: '/centers' }
        ]}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Examirror Authorized Study Centers Directory',
          description: 'Verified educational centers and franchisee branches operating under Examirror across India.'
        }}
      />
      {/* Header Banner with Apple Compact Height & Motion */}
      <section className="bg-slate-950 text-white py-4 sm:py-5 text-center relative overflow-hidden border-b border-slate-800/80">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/15 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-1.5">
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
          >
            <ShieldCheck size={13} />
            <span>Centralized Authorized Center Network</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight"
          >
            Authorized Study Centers
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="text-slate-300 text-xs sm:text-[13px] max-w-2xl mx-auto leading-normal"
          >
            Locate official affiliated skill development and computer education centers across India with active authorization and certified infrastructure.
          </motion.p>
        </div>
      </section>

      {/* Main Filter & Content Section */}
      <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Search & Filter Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <input
                type="text"
                placeholder="Search by center name, code (e.g. EXM-CEN), city, or district..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-colors text-slate-800 placeholder-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* State Select */}
            <div className="md:col-span-4 relative">
              <select
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 outline-none bg-white text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              <MapPin className="absolute left-3.5 top-3 text-slate-400" size={16} />
            </div>

            {/* List / Map Toggle */}
            <div className="md:col-span-2 flex items-center justify-end gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <List size={14} />
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${viewMode === 'map'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <MapIcon size={14} />
                <span>Map</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-6 px-1">
          <p className="text-xs font-semibold text-slate-500">
            Found <span className="font-bold text-slate-900">{filteredCenters.length}</span> authorized study centers
            {selectedState !== 'All States' && ` in ${selectedState}`}
          </p>
          {(searchQuery || selectedState !== 'All States') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedState('All States');
              }}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Map View Mode */}
        {viewMode === 'map' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Interactive Study Center Locator</h3>
                <p className="text-xs text-slate-500">Click any center below to open verified navigation directions.</p>
              </div>
              <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                Live Geolocation Support
              </span>
            </div>
            <div className="h-72 w-full rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                <MapPin size={24} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">Central Directory Map Preview</h4>
              <p className="text-xs text-slate-500 max-w-md mb-4">
                Selecting a center from the cards below will route directly to Google Maps navigation for authentic street directions.
              </p>
              <button
                onClick={() => setViewMode('list')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Switch to Card Grid View
              </button>
            </div>
          </div>
        )}

        {/* Center Cards Grid */}
        {isLoading ? (
          /* Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((sk) => (
              <div
                key={sk}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs animate-pulse space-y-4"
              >
                <div className="h-5 bg-slate-200 rounded w-1/3" />
                <div className="h-6 bg-slate-200 rounded w-3/4" />
                <div className="h-16 bg-slate-100 rounded-xl" />
                <div className="h-10 bg-slate-200 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : filteredCenters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCenters.map((center, index) => (
              <motion.div
                key={center.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.25) }}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
              >
                {/* Top Badge & Code */}
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                      {center.code}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px] font-bold">
                      <CheckCircle2 size={12} />
                      <span>Authorized</span>
                    </span>
                  </div>

                  {/* Center Name */}
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 mt-3.5 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[48px]">
                    {center.name}
                  </h3>

                  {/* Address & Location */}
                  <div className="space-y-2 text-xs text-slate-600 my-3">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-blue-600 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">
                        {center.address}
                        {center.addressLine2 ? `, ${center.addressLine2}` : ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="font-semibold text-slate-700">
                        {center.city}, {center.state}
                      </span>
                      {center.pincode && (
                        <span className="font-mono text-slate-500">PIN: {center.pincode}</span>
                      )}
                    </div>
                  </div>

                  {/* Director / Head Info */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Center Head:</span>
                    <span className="font-semibold text-slate-800">{center.headName}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <a
                    href={getDirectionsUrl(center)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-200 cursor-pointer active:scale-98"
                  >
                    <Navigation size={13} className="text-blue-600" />
                    <span>Directions</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setSelectedCenterForModal(center)}
                    className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    <span>View Details</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs max-w-lg mx-auto">
            <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Building2 size={26} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No authorized centers found</h3>
            <p className="text-xs text-slate-500 mb-5">
              We couldn't find any study centers in this location. Try choosing "All States" or adjusting your search term.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedState('All States');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Show All Authorized Centers
            </button>
          </div>
        )}
      </section>

      {/* Center Details Modal */}
      <AnimatePresence>
        {selectedCenterForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 bg-slate-900 text-white relative">
                <button
                  type="button"
                  onClick={() => setSelectedCenterForModal(null)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>

                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-md text-[11px] font-bold mb-2">
                  <CheckCircle2 size={12} />
                  <span>Authorized Learning Center</span>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-white pr-8">
                  {selectedCenterForModal.name}
                </h3>
                <span className="text-slate-300 font-mono text-xs">
                  Center Code: {selectedCenterForModal.code}
                </span>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 text-xs text-slate-700">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin size={15} className="text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 block">Complete Address:</span>
                      <span>
                        {selectedCenterForModal.address}
                        {selectedCenterForModal.addressLine2 ? `, ${selectedCenterForModal.addressLine2}` : ''}
                      </span>
                      <span className="block font-semibold text-slate-800 mt-0.5">
                        {selectedCenterForModal.city}, {selectedCenterForModal.state} {selectedCenterForModal.pincode ? `- ${selectedCenterForModal.pincode}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Center Director</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{selectedCenterForModal.headName}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Affiliation Status</span>
                    <span className="font-bold text-emerald-700 text-sm mt-0.5 flex items-center gap-1">
                      <CheckCircle2 size={13} /> Active & Verified
                    </span>
                  </div>
                </div>

                {selectedCenterForModal.authorizedCourses && selectedCenterForModal.authorizedCourses.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="font-bold text-slate-900 block">Authorized Program Streams:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCenterForModal.authorizedCourses.map((c, i) => (
                        <span
                          key={i}
                          className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCenterForModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Close
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCertModalOpen(true)}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Award size={13} />
                    <span>View Affiliation Certificate</span>
                  </button>
                  <a
                    href={getDirectionsUrl(selectedCenterForModal)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5"
                  >
                    <Navigation size={13} />
                    <span>Get Directions</span>
                  </a>
                  <Link
                    to={`/contact?center=${encodeURIComponent(selectedCenterForModal.name)}&code=${encodeURIComponent(selectedCenterForModal.code)}`}
                    onClick={() => setSelectedCenterForModal(null)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5"
                  >
                    <span>Contact / Inquire</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Center Affiliation Certificate Modal (Lazy Loaded) */}
      {isCertModalOpen && selectedCenterForModal && (
        <Suspense fallback={null}>
          <CenterCertificateModal
            center={{
              id: selectedCenterForModal.id,
              centerName: selectedCenterForModal.name,
              centerCode: selectedCenterForModal.code,
              headName: selectedCenterForModal.headName,
              headPhoto: selectedCenterForModal.headImageUrl,
              phone: selectedCenterForModal.phone,
              email: selectedCenterForModal.email,
              address: selectedCenterForModal.address,
              addressLine2: selectedCenterForModal.addressLine2,
              city: selectedCenterForModal.city,
              district: selectedCenterForModal.district,
              state: selectedCenterForModal.state,
              pincode: selectedCenterForModal.pincode
            }}
            isOpen={isCertModalOpen}
            onClose={() => setIsCertModalOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Centers;
