import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, X, ExternalLink, Megaphone, Info, Gift, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_global: boolean;
  created_at: string;
}

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("is_global", true)
        .or("expires_at.is.null,expires_at.gt.now()")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as Notification[];
    },
  });

  // Fetch read notifications for the user
  const { data: readNotifications = [] } = useQuery({
    queryKey: ["notification-reads", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_notification_reads")
        .select("notification_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map((r) => r.notification_id);
    },
    enabled: !!user,
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user) return;
      const { error } = await supabase.from("user_notification_reads").insert({
        user_id: user.id,
        notification_id: notificationId,
      });
      if (error && error.code !== "23505") throw error; // Ignore duplicate key error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-reads"] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const unreadIds = notifications
        .filter((n) => !readNotifications.includes(n.id))
        .map((n) => n.id);
      
      if (unreadIds.length === 0) return;
      
      const inserts = unreadIds.map((id) => ({
        user_id: user.id,
        notification_id: id,
      }));
      
      const { error } = await supabase
        .from("user_notification_reads")
        .upsert(inserts, { onConflict: "user_id,notification_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-reads"] });
    },
  });

  const unreadCount = user
    ? notifications.filter((n) => !readNotifications.includes(n.id)).length
    : notifications.length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "promo":
        return <Gift className="h-4 w-4 text-primary" />;
      case "success":
        return <Megaphone className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case "promo":
        return "bg-primary/10";
      case "success":
        return "bg-green-500/10";
      case "warning":
        return "bg-yellow-500/10";
      default:
        return "bg-blue-500/10";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full hover:bg-primary/10 text-foreground hover:text-primary transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold shadow-lg animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {user && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllAsReadMutation.mutate()}
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const isRead = user && readNotifications.includes(notification.id);
                
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-secondary/50 transition-colors cursor-pointer relative",
                      !isRead && "bg-primary/5"
                    )}
                    onClick={() => {
                      if (user && !isRead) {
                        markAsReadMutation.mutate(notification.id);
                      }
                      if (notification.link) {
                        setIsOpen(false);
                      }
                    }}
                  >
                    {!isRead && (
                      <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary" />
                    )}
                    <div className="flex gap-3">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", getTypeBg(notification.type))}>
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground line-clamp-1">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                          {notification.link && (
                            <Link
                              to={notification.link}
                              className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                              }}
                            >
                              View <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        {!user && notifications.length > 0 && (
          <div className="p-3 border-t bg-secondary/30">
            <p className="text-xs text-muted-foreground text-center">
              <Link to="/auth" className="text-primary hover:underline" onClick={() => setIsOpen(false)}>
                Sign in
              </Link>
              {" "}to track read notifications
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
