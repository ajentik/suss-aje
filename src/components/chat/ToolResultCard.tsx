"use client";

import { memo } from "react";
import { MapPin, Calendar, Info, Star, Clock, Navigation } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { POI, CampusEvent } from "@/types";

interface NavigateOutput {
  success: boolean;
  poi?: POI;
  message: string;
}

interface ShowEventsOutput {
  success: boolean;
  events: CampusEvent[];
  filters: { date?: string; category?: string; range?: string };
  message: string;
}

interface CampusInfoOutput {
  success: boolean;
  query: string;
  answer: string;
  venues?: POI[];
}

function ToolLoadingSkeleton({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2 animate-chat-fade-in">
      <span className="inline-flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary animate-thinking-dot"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </span>
      <span className="text-xs text-muted-foreground italic">{label}</span>
    </div>
  );
}

function LocationCard({ output }: { output: NavigateOutput }) {
  const poi = output.poi;
  if (!poi) {
    return (
      <Card size="sm" className="bg-destructive/5 ring-destructive/20 animate-chat-scale-in">
        <CardContent className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{output.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm" className="bg-surface-brand/5 ring-primary/20 animate-chat-scale-in shadow-sm">
      <CardContent className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5 flex items-center justify-center w-9 h-9 rounded-full bg-primary/10">
          <MapPin className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm leading-snug">{poi.name}</p>
            <Badge variant="secondary" className="text-[0.625rem]">
              {poi.category}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {poi.description}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {poi.address && (
              <span className="flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                {poi.address}
              </span>
            )}
            {poi.hours && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {poi.hours}
              </span>
            )}
            {poi.rating && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {poi.rating}/5
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  "On-Campus": "bg-event-oncampus-bg text-event-oncampus-fg",
  Online: "bg-event-online-bg text-event-online-fg",
  External: "bg-event-external-bg text-event-external-fg",
};

function EventListCard({ output }: { output: ShowEventsOutput }) {
  const { events, message } = output;

  if (events.length === 0) {
    return (
      <Card size="sm" className="bg-muted/30 animate-chat-scale-in">
        <CardContent className="flex items-start gap-2.5">
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const displayEvents = events.slice(0, 5);
  const remaining = events.length - displayEvents.length;

  return (
    <Card size="sm" className="bg-card animate-chat-scale-in shadow-sm">
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs font-medium text-muted-foreground">{message}</p>
        </div>
        <div className="space-y-1.5">
          {displayEvents.map((event) => {
            const dateDisplay = event.endDate
              ? `${event.date} \u2013 ${event.endDate}`
              : event.date;
            return (
              <div
                key={event.id}
                className="flex flex-col gap-1 rounded-xl border p-3 text-sm transition-colors active:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-[0.8125rem] leading-snug">
                    {event.title}
                  </span>
                  <Badge variant="secondary" className="text-[0.625rem] shrink-0">
                    {event.category}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{dateDisplay}</span>
                  <span>&middot;</span>
                  <span>{event.time}</span>
                  <span>&middot;</span>
                  <span className="truncate max-w-[140px]">{event.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {event.type && (
                    <span
                      className={cn(
                        "text-[0.625rem] px-1.5 py-0.5 rounded-full font-medium",
                        EVENT_TYPE_COLORS[event.type] ?? "bg-muted text-muted-foreground"
                      )}
                    >
                      {event.type}
                    </span>
                  )}
                  {event.school && (
                    <span className="text-[0.625rem] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                      {event.school}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {remaining > 0 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            +{remaining} more event{remaining > 1 ? "s" : ""} — check the Events
            tab for all results
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function CampusInfoCard({ output }: { output: CampusInfoOutput }) {
  return (
    <Card size="sm" className="bg-card animate-chat-scale-in shadow-sm">
      <CardContent className="space-y-2">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {output.answer}
          </p>
        </div>
        {output.venues && output.venues.length > 0 && (
          <div className="space-y-1.5 pl-6">
            {output.venues.map((venue) => (
              <div
                key={venue.id}
                className="flex items-start gap-2 rounded-xl border p-2.5 text-xs transition-colors active:bg-muted/50"
              >
                <MapPin className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{venue.name}</span>
                  {venue.address && (
                    <span className="text-muted-foreground">
                      {" "}
                      &mdash; {venue.address}
                    </span>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground mt-0.5">
                    {venue.hours && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {venue.hours}
                      </span>
                    )}
                    {venue.rating && (
                      <span className="flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        {venue.rating}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ToolResultCardProps {
  toolName: string;
  output: Record<string, unknown>;
  state: string;
}

function ToolResultCardInner({ toolName, output, state }: ToolResultCardProps) {
  if (state !== "output-available") {
    const label =
      toolName === "navigate_to"
        ? "Finding location..."
        : toolName === "show_events"
          ? "Searching events..."
          : "Looking up campus info...";
    return <ToolLoadingSkeleton label={label} />;
  }

  switch (toolName) {
    case "navigate_to":
      return <LocationCard output={output as unknown as NavigateOutput} />;
    case "show_events":
      return <EventListCard output={output as unknown as ShowEventsOutput} />;
    case "campus_info":
      return <CampusInfoCard output={output as unknown as CampusInfoOutput} />;
    default:
      return null;
  }
}

const ToolResultCard = memo(ToolResultCardInner);
ToolResultCard.displayName = "ToolResultCard";

export default ToolResultCard;
