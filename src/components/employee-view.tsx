'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { LogIn, LogOut, FileText, CheckCircle, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export function EmployeeView() {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleCheckIn = () => {
    setIsCheckedIn(true);
    setCheckInTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const handleCheckOut = () => {
    // Logic for submitting checkout observations
    setShowDialog(false);
    setIsCheckedIn(false);
    // Resetting time is optional, might want to show last checkout time
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card className="h-full shadow-lg transition-shadow hover:shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              Time Clock
            </CardTitle>
            <CardDescription>Manage your work day</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
            {isCheckedIn ? (
              <>
                <p className="text-lg font-semibold text-[hsl(var(--chart-2))]">You are checked in.</p>
                <p className="text-muted-foreground">
                  Since: {checkInTime}
                </p>
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="lg" className="w-full font-bold">
                      <LogOut className="mr-2 h-5 w-5" />
                      Check Out
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="font-headline">End of Jornada</DialogTitle>
                      <DialogDescription>
                        Please add any final observations or comments before checking out.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid w-full gap-2">
                         <Label htmlFor="observations">Observations</Label>
                         <Textarea id="observations" placeholder="Any issues, achievements, or blockers..." />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                         <Button variant="ghost">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleCheckOut} className="bg-accent text-accent-foreground hover:bg-accent/90">Submit & Check Out</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-muted-foreground">You are checked out.</p>
                <Button onClick={handleCheckIn} size="lg" className="w-full font-bold bg-accent text-accent-foreground hover:bg-accent/90">
                  <LogIn className="mr-2 h-5 w-5" />
                  Check In
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="shadow-lg transition-shadow hover:shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Today's Tasks & Goals
            </CardTitle>
            <CardDescription>
              Outline your objectives for the day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <Textarea
                placeholder="- Launch new feature&#10;- Team meeting at 2 PM&#10;- Review PRs"
                rows={5}
              />
              <Button className="font-bold">Save Tasks</Button>
            </form>
          </CardContent>
        </Card>
      </div>
      
      <div className="lg:col-span-3">
         <Card className="shadow-lg transition-shadow hover:shadow-xl">
            <CardHeader>
               <CardTitle className="font-headline flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-primary" />
                  Activity & Goal Progress
               </CardTitle>
               <CardDescription>
                  Log your activities and update the status of your goals throughout the day.
               </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Textarea placeholder="Describe your activity..."/>
                    <Button className="font-bold">Log Activity</Button>
                </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
