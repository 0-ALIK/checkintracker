'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';

const employees = [
  {
    id: 1,
    name: 'Ana Silva',
    avatarHint: 'woman person',
    email: 'ana.silva@example.com',
    status: 'Pending Approval',
    checkIn: '09:02 AM',
    checkOut: '05:58 PM',
  },
  {
    id: 2,
    name: 'Carlos Santos',
    avatarHint: 'man professional',
    email: 'carlos.santos@example.com',
    status: 'Online',
    checkIn: '08:55 AM',
    checkOut: '-',
  },
  {
    id: 3,
    name: 'Mariana Costa',
    avatarHint: 'woman professional',
    email: 'mariana.costa@example.com',
    status: 'Approved',
    checkIn: '09:15 AM',
    checkOut: '06:05 PM',
  },
  {
    id: 4,
    name: 'Pedro Almeida',
    avatarHint: 'man person',
    email: 'pedro.almeida@example.com',
    status: 'Offline',
    checkIn: '-',
    checkOut: '-',
  },
];

const getStatusClass = (status: string) => {
    switch (status) {
      case 'Online':
        return 'bg-[hsl(var(--chart-2))] text-primary-foreground hover:bg-[hsl(var(--chart-2))]';
      case 'Pending Approval':
        return 'bg-[hsl(var(--chart-4))] text-accent-foreground hover:bg-[hsl(var(--chart-4))]';
      case 'Approved':
        return 'bg-primary text-primary-foreground hover:bg-primary';
      default: // Offline
        return 'bg-secondary text-secondary-foreground hover:bg-secondary';
    }
}

export function SupervisorView() {
  const [currentDate, setCurrentDate] = useState('');
  
  useEffect(() => {
      setCurrentDate(new Date().toLocaleDateString());
  }, []);

  return (
    <Card className="shadow-lg transition-shadow hover:shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline">Team Jornadas</CardTitle>
        <CardDescription>
          Review and manage your team's work day records.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Employee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src="https://placehold.co/100x100.png" alt={employee.name} data-ai-hint={employee.avatarHint}/>
                      <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{employee.name}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusClass(employee.status)}>{employee.status}</Badge>
                </TableCell>
                <TableCell>{employee.checkIn}</TableCell>
                <TableCell>{employee.checkOut}</TableCell>
                <TableCell className="text-right">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm">View Jornada</Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle className="font-headline text-2xl">{employee.name}'s Jornada</SheetTitle>
                        <SheetDescription>
                          Date: {currentDate}
                        </SheetDescription>
                      </SheetHeader>
                      <Separator className="my-4" />
                      <div className="space-y-6 py-4">
                        <div>
                          <h4 className="font-headline text-lg mb-2">Work Hours</h4>
                          <p><strong>Check-in:</strong> {employee.checkIn}</p>
                          <p><strong>Check-out:</strong> {employee.checkOut}</p>
                        </div>
                        <div>
                          <h4 className="font-headline text-lg mb-2">Employee's Tasks & Goals</h4>
                          <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                            - Launched new feature on the main dashboard.<br/>
                            - Attended the Q3 planning meeting.<br/>
                            - Reviewed and merged 3 pull requests.
                          </p>
                        </div>
                         <div>
                          <h4 className="font-headline text-lg mb-2">Employee's Closing Remarks</h4>
                          <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                            Faced a small issue with the deployment script, but it was resolved quickly. Overall a productive day.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-headline text-lg mb-2">Supervisor Comments</h4>
                          <div className="space-y-3">
                             <div className="text-sm p-3 bg-muted rounded-md">
                                <p className="font-bold">You (Supervisor):</p>
                                <p>"Great job on the feature launch!"</p>
                                <p className="text-xs text-muted-foreground italic mt-1">2 hours ago</p>
                             </div>
                          </div>
                        </div>

                        <div>
                            <h4 className="font-headline text-lg mb-2">Add New Comment</h4>
                            <Textarea placeholder="Type your comment here..."/>
                            <Button className="mt-2">
                               <MessageSquare className="mr-2 h-4 w-4"/>
                               Post Comment
                            </Button>
                        </div>
                      </div>
                      <SheetFooter className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
                         <SheetClose asChild>
                            <Button variant="ghost">Close</Button>
                         </SheetClose>
                         <div className="flex gap-2 justify-end">
                            <Button variant="destructive">
                                <ThumbsDown className="mr-2 h-4 w-4"/>
                                Reject
                            </Button>
                            <Button className="bg-[hsl(var(--chart-2))] hover:bg-[hsl(var(--chart-2))] text-primary-foreground">
                                <ThumbsUp className="mr-2 h-4 w-4"/>
                                Approve
                            </Button>
                         </div>
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
