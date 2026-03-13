import { NextResponse } from "next/server";
import campusEvents from "@/../public/campus-events.json";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const category = searchParams.get("category");

  let events = campusEvents;

  if (date) {
    events = events.filter((e) => e.date === date);
  }
  if (category) {
    const cat = category.toLowerCase();
    events = events.filter((e) => e.category.toLowerCase().includes(cat));
  }

  return NextResponse.json(events);
}
