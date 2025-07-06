import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmployeeView } from '@/components/employee-view';
import { SupervisorView } from '@/components/supervisor-view';
import { Briefcase, Users } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="container mx-auto max-w-7xl">
      <Tabs defaultValue="employee" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="employee" className="font-headline">
            <Briefcase className="mr-2 h-4 w-4" />
            My Jornada
          </TabsTrigger>
          <TabsTrigger value="supervisor" className="font-headline">
            <Users className="mr-2 h-4 w-4" />
            Team View
          </TabsTrigger>
        </TabsList>
        <TabsContent value="employee" className="mt-6">
          <EmployeeView />
        </TabsContent>
        <TabsContent value="supervisor" className="mt-6">
          <SupervisorView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
