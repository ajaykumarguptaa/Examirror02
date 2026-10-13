import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Target, Award, Sparkles, CheckCircle2, ShieldCheck, Users, GraduationCap, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import SEO from '../../components/SEO';
import { Tilt3DCard } from '../../components/ui';

const DEFAULT_ABOUT_DATA = {
  header: {
    title: 'About Examirror Skill Development & Education',
    subtitle: 'Pioneering technical and vocational skill education across India with authorized study center networks.'
  },
  overview: {
    mainText: 'The goal of the computers education curriculum is to provide students with the computer knowledge and tools that will allow them to design and implement effective, economical, and creative solutions for the needs of individuals, society, and the high-tech economy.',
    highlightBadge: 'ISO 9001:2015 Certified Educational Institution',
    imageUrl: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=800'
  },
  points: [
    'The goal of the computers education curriculum is to provide students with the computer knowledge and tools that will allow them to design and implement effective, economical, and creative solutions for the needs of individuals, society, and the high-tech economy.',
    'In our Institute Computer Education to all class of students in a very affordable fees structure. Examirror also offers reasonable fees structure for financially weaker section who cannot afford the same.',
    'Examirror regularly organized workshops, seminars, conventions and Technical for the benefit of professionals and users of IT apart from conducting continuing education and professional development program.',
    'Examirror is the platform for unchanging the able and for better career opportunities. Here we assure the bright future of candidate in the computer education.',
    'Examirror successfully running many centers all over India which focuses on success of the candidate with the updated Technology and fertility in India and therefore Examirror is successfully running many centers all over India and its franchises.'
  ],
  leadershipTeam: {
    enabled: true,
    title: 'Examirror – Leadership Team',
    subtitle: 'Experienced leadership steering excellence in national skill education and vocational certification.',
    members: [
      {
        id: 1,
        name: 'Dulal Kanti Mahato',
        role: 'DIRECTOR 1',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: 2,
        name: 'Laxmi Priya Mahato',
        role: 'DIRECTOR 2',
        imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: 3,
        name: 'Karan Mahato',
        role: 'ACCOUNTANT',
        imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400'
      }
    ]
  }
};

const About = () => {
  // TanStack Query for Dynamic About Page & Leadership Settings
  const { data, isLoading } = useQuery({
    queryKey: ['about-page-data'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/v1/settings/about');
        if (!response.ok) throw new Error('Failed to fetch');
        const json = await response.json();
        return json.data || null;
      } catch (error) {
        return null;
      }
    }
  });

  const pageData = data || DEFAULT_ABOUT_DATA;

  // Normalized values
  const pageTitle = pageData?.header?.title || pageData?.title || DEFAULT_ABOUT_DATA.header.title;
  const overviewImage = pageData?.overview?.imageUrl || pageData?.imageUrl || DEFAULT_ABOUT_DATA.overview.imageUrl;
  const points = Array.isArray(pageData?.points) && pageData.points.length > 0
    ? pageData.points
    : DEFAULT_ABOUT_DATA.points;

  const leadership = pageData?.leadershipTeam?.members
    ? pageData.leadershipTeam
    : pageData?.team
    ? {
        enabled: true,
        title: pageData.teamTitle || 'Examirror – Leadership Team',
        members: pageData.team
      }
    : DEFAULT_ABOUT_DATA.leadershipTeam;

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <SEO
        title="About Us | Examirror"
        description="Learn about Examirror's mission, leadership, and ISO 9001:2015 certified national skill development education network empowering youth with job-ready IT skills across India."
        keywords={[
          'About Examirror',
          'Skill Education Institute',
          'ISO 9001:2015 Certified Computer Institute',
          'Computer Education Franchise',
          'Vocational Training Network India'
        ]}
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'About Us', item: '/about' }
        ]}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About Examirror',
          description: 'Pioneering technical and vocational skill education across India with authorized study center networks.',
          publisher: {
            '@type': 'EducationalOrganization',
            name: 'Examirror',
            logo: 'https://examirror.edu.in/assets/logo.png'
          }
        }}
      />
      {/* Header Banner */}
      <section className="bg-slate-900 text-white py-14 sm:py-16 text-center relative overflow-hidden border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-400/20 text-blue-300 px-3 py-1 rounded-full text-xs font-semibold">
            <ShieldCheck size={14} />
            <span>National Skill Development & Vocational Training</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            {pageTitle}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {pageData?.header?.subtitle || DEFAULT_ABOUT_DATA.header.subtitle}
          </p>
        </div>
      </section>

      {/* About Overview Section */}
      <section className="py-14 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Side: Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 relative flex justify-center"
          >
            <Tilt3DCard maxTilt={8} scale={1.02} glare={true} className="relative z-10 max-w-md w-full aspect-square">
              <div className="overflow-hidden rounded-3xl border-2 border-slate-200 shadow-md w-full h-full bg-slate-100">
                <img
                  src={overviewImage}
                  alt="About Examirror"
                  className="w-full h-full object-cover"
                />
              </div>
            </Tilt3DCard>
            <div className="absolute top-4 -right-2 w-full h-full max-w-md bg-blue-50 rounded-3xl border border-blue-100 -z-10"></div>
          </motion.div>

          {/* Right Side: Key Pillars */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-3.5"
          >
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold mb-1">
              <Award size={14} />
              <span>{pageData?.overview?.highlightBadge || 'ISO 9001:2015 Certified Educational Institution'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Empowering India's Next Generation of Skilled Professionals
            </h2>

            <div className="space-y-3 pt-2">
              {points.map((point: string, index: number) => (
                <div
                  key={index}
                  className="flex items-start gap-3 bg-slate-50 hover:bg-slate-100/80 p-3.5 rounded-xl border border-slate-200 transition-colors"
                >
                  <div className="mt-0.5 shrink-0 text-blue-600">
                    <CheckCircle2 size={18} />
                  </div>
                  <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Leadership Team Section (Configured by Super Admin) */}
      {leadership?.enabled !== false && leadership?.members && leadership.members.length > 0 && (
        <section className="py-16 sm:py-20 bg-slate-50/70 border-t border-slate-200 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Centered Heading */}
            <div className="text-center mb-12 sm:mb-14 space-y-2">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {leadership.title || 'Examirror – Leadership Team'}
              </h2>
              {leadership.subtitle && (
                <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
                  {leadership.subtitle}
                </p>
              )}
            </div>

            {/* Team Cards Grid / Flex */}
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 max-w-5xl mx-auto">
              {leadership.members.map((member: any, index: number) => (
                <motion.div
                  key={member.id || index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.08 }}
                  className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col items-center w-full max-w-[300px] text-center group"
                >
                  {/* Photo Frame */}
                  <div className="w-56 h-64 rounded-xl overflow-hidden border border-slate-200 shadow-2xs mb-5 bg-slate-100 group-hover:scale-102 transition-transform duration-300">
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';
                      }}
                    />
                  </div>

                  {/* Member Name */}
                  <h3 className="font-bold text-lg sm:text-xl text-slate-900 mb-2.5 line-clamp-1">
                    {member.name}
                  </h3>

                  {/* Dark Pill Badge for Role */}
                  <span className="inline-block bg-[#1e1b4b] text-white text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-2xs">
                    {member.role}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default About;
