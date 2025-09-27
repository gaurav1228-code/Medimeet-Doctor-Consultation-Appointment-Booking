// components/DoctorCard.jsx
import { User, Star, Calendar, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function DoctorCard({ doctor }) {
  return (
    <Card className="border-emerald-900/20 hover:border-emerald-700/40 transition-all h-full">
      <CardContent className="px-6 h-full flex flex-col">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-16 h-16 rounded-full bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
            {doctor.image_url ? (
              <img
                src={doctor.image_url}
                alt={doctor.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-emerald-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <h3 className="font-semibold text-white text-lg truncate">{doctor.name}</h3>
              <Badge
                variant="outline"
                className="bg-emerald-900/20 border-emerald-900/30 text-emerald-400 shrink-0"
              >
                <Star className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mb-3">
              {doctor.specialty} • {doctor.experience} years experience
            </p>

            {doctor.description && (
              <div className="line-clamp-2 text-sm text-muted-foreground mb-4 flex-1">
                {doctor.description}
              </div>
            )}

            <div className="flex items-center justify-around mt-auto pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>30 min • 2 credits</span>
              </div>
              
              <Button
                asChild
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-600 shrink-0"
              >
                <Link href={`/Patient-dashboard/speciality/${encodeURIComponent(doctor.specialty)}/${doctor.id}`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  View Profile
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
