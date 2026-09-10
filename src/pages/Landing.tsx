import { Link } from "react-router";
import {
  Sprout,
  Zap,
  AlertTriangle,
  BarChart3,
  Calendar,
  Wrench,
  WifiOff,
  Truck,
  Droplets,
  Warehouse,
  Users,
  Plane,
  ArrowRight,
  ChevronRight,
  Shield,
  Clock,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Zap,
    title: "Smart Resource Allocation",
    desc: "Deterministic priority scoring ensures the most urgent needs are met first.",
  },
  {
    icon: AlertTriangle,
    title: "Conflict Detection",
    desc: "Automatically detects overlapping requests and prevents double booking.",
  },
  {
    icon: BarChart3,
    title: "Transparent Priority",
    desc: "Every farmer sees exactly how their 0–100 priority score is calculated.",
  },
  {
    icon: Calendar,
    title: "Intelligent Scheduling",
    desc: "Considers travel time, buffer, operating hours, and constraints.",
  },
  {
    icon: Wrench,
    title: "Disruption Management",
    desc: "Explicit reallocation when breakdowns, weather, or cancellations occur.",
  },
  {
    icon: WifiOff,
    title: "Offline-First Requests",
    desc: "Create requests offline and sync automatically when connectivity returns.",
  },
];

const categories = [
  { icon: Truck, title: "Agricultural Machinery", items: "Tractors, Harvesters, Tillers, Seeders", color: "bg-green-100 text-green-700" },
  { icon: Droplets, title: "Irrigation Equipment", items: "Portable Pumps, Drip Lines, Sprinkler Sets", color: "bg-blue-100 text-blue-700" },
  { icon: Warehouse, title: "Storage Facilities", items: "Solar Storage, Cold Storage", color: "bg-amber-100 text-amber-700" },
  { icon: Truck, title: "Transportation", items: "Mini Trucks, Trailers, Grain Carts", color: "bg-orange-100 text-orange-700" },
  { icon: Users, title: "Agricultural Labour", items: "Sowing, Weeding, Harvesting Teams", color: "bg-purple-100 text-purple-700" },
  { icon: Plane, title: "Specialized Services", items: "Drone Spraying, Soil Testing, Grafting", color: "bg-cyan-100 text-cyan-700" },
];

const steps = [
  { num: "1", title: "Submit Request", desc: "Farmer describes what resource they need, when, and how urgent it is.", icon: "📋" },
  { num: "2", title: "Calculate Priority", desc: "Deterministic 0–100 scoring based on urgency, weather, crop stage, and more.", icon: "📊" },
  { num: "3", title: "Detect Conflicts", desc: "System identifies overlapping requests for the same physical resource.", icon: "⚠️" },
  { num: "4", title: "Generate Schedule", desc: "Creates feasible allocation with travel time and buffer between bookings.", icon: "📅" },
  { num: "5", title: "Monitor Notifications", desc: "Weather alerts, breakdowns, and schedule changes are communicated clearly.", icon: "🔔" },
  { num: "6", title: "Explicit Reallocation", desc: "When disruptions require it, admin explicitly triggers reallocation.", icon: "🔄" },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-800 via-green-700 to-emerald-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-yellow-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-green-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
              <Sprout className="h-4 w-4" />
              <span>Smart Agricultural Resource Coordination</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              FarmGrid
              <span className="block text-2xl md:text-3xl font-medium text-green-200 mt-2">
                Smart Coordination for Every Farm
              </span>
            </h1>
            <p className="text-lg md:text-xl text-green-100 mb-8 max-w-2xl leading-relaxed">
              Connect agricultural resources with the farmers who need them, prioritize urgent requirements, prevent conflicts, and create smarter schedules.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/farmer-portal">
                <Button size="lg" className="bg-white text-green-800 hover:bg-green-50 font-semibold px-8">
                  Request a Resource
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/resource-owner">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold px-8">
                  Manage Resources
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Resources", value: "8", icon: Truck },
            { label: "Farmers", value: "6", icon: Users },
            { label: "Active Requests", value: "6", icon: BarChart3 },
            { label: "Priority Scoring", value: "0–100", icon: Shield },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why FarmGrid */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Why FarmGrid?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete agricultural resource coordination platform, not just a marketplace.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <Card key={f.title} className="hover:shadow-lg transition-shadow border-border/60">
                <CardContent className="p-6">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Resource Categories */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Resource Categories</h2>
            <p className="text-muted-foreground">Six categories of agricultural resources, coordinated intelligently.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => (
              <Card key={cat.title} className="hover:shadow-md transition-shadow border-border/60">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cat.color}`}>
                    <cat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{cat.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{cat.items}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">How FarmGrid Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From request to allocation — a transparent, deterministic process.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div key={step.num} className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{step.icon}</span>
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {step.num}
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-green-700 to-emerald-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Coordinate?</h2>
          <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
            Start managing agricultural resources with intelligent scheduling, transparent priorities, and conflict detection.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/farmer-portal">
              <Button size="lg" className="bg-white text-green-800 hover:bg-green-50 font-semibold px-8">
                Get Started
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold px-8">
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-900 text-green-200 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sprout className="h-5 w-5" />
            <span className="font-semibold">FarmGrid</span>
            <span className="text-green-400 text-sm">— Smart Coordination for Every Farm</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/farmer-portal" className="hover:text-white transition-colors">Farmer Portal</Link>
            <Link to="/schedule" className="hover:text-white transition-colors">Schedule</Link>
            <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
