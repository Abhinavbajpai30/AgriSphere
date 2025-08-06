import { motion } from 'framer-motion'
import { 
  HeartIcon,
  BeakerIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
  TrophyIcon,
  UsersIcon,
  ShieldCheckIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

const About = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  }

  const features = [
    {
      icon: HeartIcon,
      title: "AI Crop Doctor",
      description: "Instant disease diagnosis with photo analysis and accessible treatment steps",
      emoji: "🩺",
      color: "from-orange-400 to-red-500"
    },
    {
      icon: BeakerIcon,
      title: "Smart Irrigation Advisor",
      description: "Real-time water management using local weather and soil data",
      emoji: "💧",
      color: "from-blue-400 to-cyan-500"
    },
    {
      icon: CalendarDaysIcon,
      title: "Climate-Smart Planner",
      description: "Future-ready crop recommendations based on climate patterns",
      emoji: "📅",
      color: "from-green-400 to-emerald-500"
    }
  ]

  const sdgGoals = [
    {
      icon: TrophyIcon,
      title: "No Poverty (SDG 1)",
      description: "Improving farm productivity and profitability",
      color: "from-yellow-400 to-orange-500"
    },
    {
      icon: UsersIcon,
      title: "Zero Hunger (SDG 2)",
      description: "Increasing crop yields and reducing food loss",
      color: "from-green-400 to-emerald-500"
    },
    {
      icon: BeakerIcon,
      title: "Clean Water (SDG 6)",
      description: "Promoting radical water efficiency in agriculture",
      color: "from-blue-400 to-cyan-500"
    },
    {
      icon: GlobeAltIcon,
      title: "Climate Action (SDG 13)",
      description: "Adapting to climate change with smart tools",
      color: "from-emerald-400 to-green-600"
    }
  ]

  const steps = [
    {
      number: "01",
      title: "Map Your Farm",
      description: "Simply draw a boundary around your field on a map to unlock hyper-local advice",
      emoji: "🗺️"
    },
    {
      number: "02",
      title: "Log Your Crop",
      description: "Select your current crop and planting date from our visual menu",
      emoji: "🌱"
    },
    {
      number: "03",
      title: "Access Your Dashboard",
      description: "Get daily wisdom with the most important task highlighted",
      emoji: "📊"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-orange-50">
      {/* Hero Section */}
      <section className="relative px-4 pt-20 pb-16 overflow-hidden">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-6xl mx-auto text-center"
        >
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-6">
              Cultivating the Future
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto">
              The Story of AgriSphere
            </p>
          </motion.div>
        </motion.div>

        {/* Floating Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-6xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                x: [0, 50, 0],
                rotate: [0, 180, 360],
                opacity: [0, 0.1, 0]
              }}
              transition={{
                duration: 10 + i * 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {['🌾', '🚜', '💧', '🌱', '🍃', '☀️'][i]}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Challenge Section */}
      <section className="px-4 py-16 bg-white/80 backdrop-blur-sm">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              The Challenge: A Growing Crisis on the Front Lines of Farming
            </h2>
          </motion.div>

          <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                All over the world, smallholder farmers—the very people who form the backbone of our global food supply—are facing a crisis. They are on the front lines, battling the unpredictable effects of climate change, the increasing scarcity of water, and the constant threat of crop-destroying diseases.
              </p>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                For generations, farmers have relied on traditional knowledge. But in a rapidly changing world, these methods are no longer enough. This critical information gap leads to a cascade of devastating consequences:
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-8 rounded-3xl">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Critical Consequences:</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Lower Crop Yields</h4>
                    <p className="text-gray-600">Making it harder to feed communities and earn a living</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Wasted Resources</h4>
                    <p className="text-gray-600">Precious water and expensive fertilizers used inefficiently</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Economic Instability</h4>
                    <p className="text-gray-600">Threatening the livelihoods of millions of farming families</p>
                  </div>
                </div>
              </div>
              <p className="text-red-600 font-semibold mt-6 text-center">
                This isn't just a farming problem; it's a threat to global food security.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Solution Section */}
      <section className="px-4 py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              Our Solution: AgriSphere, Your AI-Powered Digital Agronomist
            </h2>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto">
              We believe that technology can bridge this information gap. That's why we created AgriSphere, 
              an all-in-one digital toolkit designed to put the power of data directly into the hands of farmers.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-gradient-to-br from-emerald-500 to-green-600 p-8 md:p-12 rounded-3xl text-white text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Our Mission</h3>
            <p className="text-lg md:text-xl opacity-90 max-w-4xl mx-auto">
              To transform complex environmental data into clear, simple, and actionable advice that is tailored 
              to a farmer's specific field and needs. We've designed AgriSphere to be incredibly easy to use, 
              with a visual, icon-based interface and support for multiple languages.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 py-16 bg-white/80 backdrop-blur-sm">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              How AgriSphere Works for You
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              From the moment you open the app, AgriSphere becomes your trusted partner in the field.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                    {step.number}
                  </div>
                  <div className="text-4xl">{step.emoji}</div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div variants={itemVariants} className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
              Three Powerful Modules at Your Fingertips
            </h3>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <span className="text-2xl">{feature.emoji}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Purpose Section */}
      <section className="px-4 py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              Our Purpose: Seeding a More Sustainable Future
            </h2>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto mb-8">
              AgriSphere is more than just an app; it's a commitment to a better future. We are driven by the belief 
              that empowering farmers is the key to solving some of the world's most pressing challenges.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 md:p-12 rounded-3xl mb-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">OpenEPI Hackathon 2025</h3>
              <p className="text-lg text-gray-700">
                This project was born during the OpenEPI Hackathon 2025, an event dedicated to using open data for social good.
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-8">
              Supporting UN Sustainable Development Goals
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sdgGoals.map((goal, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 text-center"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${goal.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <goal.icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">{goal.title}</h4>
                  <p className="text-gray-600 text-sm">{goal.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="text-center">
            <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-8 md:p-12 rounded-3xl text-white">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Our Vision</h3>
              <p className="text-lg md:text-xl opacity-90 max-w-4xl mx-auto mb-6">
                By joining hands with NGOs, governments, and corporations, we aim to bring AgriSphere to millions 
                of farmers at little to no cost, creating a truly global yet locally-attuned agricultural support system.
              </p>
              <p className="text-xl md:text-2xl font-bold">
                Together, we can build the future of agriculture, one farmer at a time.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer CTA */}
      <section className="px-4 py-16 bg-white/80 backdrop-blur-sm">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div variants={itemVariants}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              Ready to Join the Agricultural Revolution?
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              Experience the future of farming with AgriSphere's AI-powered tools
            </p>
            <div className="flex justify-center">
              <a
                href="/register"
                className="bg-emerald-600 text-white font-semibold py-4 px-8 rounded-2xl hover:bg-emerald-700 transition-colors text-lg shadow-lg"
              >
                Get Started Today
              </a>
            </div>
          </motion.div>
        </motion.div>
      </section>
    </div>
  )
}

export default About