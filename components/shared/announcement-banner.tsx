import { Megaphone } from "lucide-react";

interface Announcement {
  title: string;
  body: string;
}

export function AnnouncementBanner({ announcement }: { announcement: Announcement }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3">
      <Megaphone className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-blue-300">{announcement.title}</p>
        <p className="text-xs text-blue-400/80 mt-0.5">{announcement.body}</p>
      </div>
    </div>
  );
}
