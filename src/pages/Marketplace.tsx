import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { Courses } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Search, Star } from "lucide-react";
import { useMemo, useState } from "react";

export default function Marketplace() {
  const all = Courses.published();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [diff, setDiff] = useState("all");

  const categories = useMemo(() => ["all", ...Array.from(new Set(all.map((c) => c.category)))], [all]);

  const filtered = all.filter(
    (c) =>
      (q === "" || c.title.toLowerCase().includes(q.toLowerCase()) || c.description.toLowerCase().includes(q.toLowerCase())) &&
      (cat === "all" || c.category === cat) &&
      (diff === "all" || c.difficulty === diff)
  );

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <SEO
        title="Browse courses — SequentialLearn"
        description="Explore mastery-based courses across design, engineering, and product. Find your next sequential learning path."
        path="/courses"
      />
      <Navbar />
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Explore courses</h1>
          <p className="text-muted-foreground">Find your next mastery path.</p>
        </div>

        <div className="grid md:grid-cols-[1fr_180px_180px] gap-3 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search courses..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-10 h-11" />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c === "all" ? "All categories" : c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={diff} onValueChange={setDiff}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">No courses match your filters.</Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c) => (
              <Link key={c.id} to={`/courses/${c.id}`}>
                <Card className="overflow-hidden bg-gradient-card border-border/60 shadow-card hover:shadow-elegant transition-smooth hover:-translate-y-1 group h-full">
                  <div className="aspect-video overflow-hidden bg-muted relative">
                    <img src={c.thumbnail} alt={c.title} className="h-full w-full object-cover group-hover:scale-105 transition-smooth" />
                    <div className="absolute top-3 right-3 rounded-full bg-background/90 backdrop-blur px-3 py-1 text-sm font-bold">${c.price}</div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span className="rounded-full bg-secondary px-2 py-0.5">{c.category}</span>
                      <span>•</span><span>{c.difficulty}</span><span>•</span><span>{c.duration}</span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-base line-clamp-2">{c.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{c.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-warning text-warning" /> {c.rating}
                        <span className="text-muted-foreground">({c.studentsCount.toLocaleString()})</span>
                      </div>
                      <div className="text-muted-foreground">{c.units.length} units</div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
