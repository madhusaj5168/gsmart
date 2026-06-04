import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Courses, Enrollments } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lock, PlayCircle, Star, Clock, Users, Award } from "lucide-react";
import { toast } from "sonner";

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const course = id ? Courses.byId(id) : null;

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        <div className="container py-20 text-center"><h2 className="text-2xl">Course not found</h2></div>
      </div>
    );
  }

  const enrollment = user ? Enrollments.find(user.id, course.id) : null;

  const handleEnroll = () => {
    if (!user) { nav("/login"); return; }
    nav(`/pay/${course.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <SEO
        title={`${course.title} — SequentialLearn`}
        description={course.description.slice(0, 155)}
        path={`/courses/${course.id}`}
        image={course.thumbnail}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: course.title,
          description: course.description,
          provider: {
            "@type": "Organization",
            name: "SequentialLearn",
            sameAs: "/",
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: course.rating,
            ratingCount: course.studentsCount,
          },
          offers: {
            "@type": "Offer",
            price: course.price,
            priceCurrency: "USD",
            category: course.category,
          },
        }}
      />
      <Navbar />
      <div className="bg-gradient-hero text-primary-foreground">
        <div className="container py-12 grid lg:grid-cols-[1fr_400px] gap-10 items-start">
          <div>
            <div className="flex items-center gap-2 mb-4 text-sm opacity-90">
              <Badge variant="secondary" className="bg-white/20 text-white border-0">{course.category}</Badge>
              <span>•</span><span>{course.difficulty}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">{course.title}</h1>
            <p className="text-lg opacity-90 mb-6 max-w-2xl">{course.description}</p>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2"><Star className="h-4 w-4 fill-warning text-warning" /> {course.rating} rating</div>
              <div className="flex items-center gap-2"><Users className="h-4 w-4" /> {course.studentsCount.toLocaleString()} students</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {course.duration}</div>
              <div className="flex items-center gap-2"><Award className="h-4 w-4" /> Certificate on completion</div>
            </div>
          </div>
          <Card className="overflow-hidden shadow-elegant bg-card text-card-foreground">
            <div className="aspect-video bg-muted relative">
              <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 grid place-items-center bg-black/30">
                <PlayCircle className="h-16 w-16 text-white drop-shadow-lg" />
              </div>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold mb-4">${course.price}</div>
              {enrollment ? (
                <Button asChild className="w-full h-12 bg-gradient-primary hover:opacity-90 shadow-glow">
                  <Link to={`/learn/${course.id}`}>Continue learning</Link>
                </Button>
              ) : (
                <Button onClick={handleEnroll} className="w-full h-12 bg-gradient-primary hover:opacity-90 shadow-glow">
                  Enroll now
                </Button>
              )}
              <p className="text-xs text-muted-foreground text-center mt-3">30-day money-back guarantee</p>
            </div>
          </Card>
        </div>
      </div>

      <div className="container py-12 grid lg:grid-cols-[1fr_350px] gap-10">
        <div className="space-y-8">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">What you'll learn</h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {course.outcomes.map((o) => (
                <li key={o} className="flex gap-2 text-sm"><CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />{o}</li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Course content</h2>
            <p className="text-sm text-muted-foreground mb-4">{course.units.length} sequential units • Quiz required between each</p>
            <div className="space-y-2">
              {course.units.map((u, i) => {
                const unlocked = enrollment?.unlockedUnits.includes(u.id);
                const completed = enrollment?.completedUnits.includes(u.id);
                return (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-secondary/50 transition-base">
                    <div className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold ${
                      completed ? "bg-success text-white" : unlocked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {completed ? <CheckCircle2 className="h-4 w-4" /> : unlocked ? i + 1 : <Lock className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">Unit {u.order}: {u.title}</div>
                      <div className="text-xs text-muted-foreground">{u.description}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{u.duration}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-3">Prerequisites</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {course.prerequisites.map((p) => <li key={p}>• {p}</li>)}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
