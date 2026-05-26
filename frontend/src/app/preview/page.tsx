'use client';

import * as React from 'react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import { Spinner } from '@/src/components/ui/spinner';
import { Switch } from '@/src/components/ui/switch';
import { Checkbox } from '@/src/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Alert } from '@/src/components/feedback-components/alert';
import { StatsCard } from '@/src/components/admin-components/stats-card';
import { LineChart } from '@/src/components/charts-components/line-chart';
import { BarChart } from '@/src/components/charts-components/bar-chart';
import { DataTable } from '@/src/components/tables/data-table';
import { PageWrapper, PageHeader } from '@/src/components/layout-components/page-wrapper';
import { PublicLayout } from '@/src/components/layout-components/public-layout';
import { 
  Users, 
  Mail, 
  Bell, 
  Search, 
  Plus, 
  Settings, 
  Trash, 
  CheckCircle2, 
  Info, 
  AlertTriangle 
} from 'lucide-react';
import { DatePicker } from '@/src/components/ui/date-picker';
import { ConfirmDialog } from '@/src/components/modals/confirm-dialog';
import { FullscreenLoader } from '@/src/components/feedback-components/fullscreen-loader';
import { toast } from 'sonner';

const tableData = [
  { id: 1, name: 'Premium Kit', status: 'Active', price: '$49.00' },
  { id: 2, name: 'Basic Template', status: 'Inactive', price: '$19.00' },
  { id: 3, name: 'Pro Dashboard', status: 'Active', price: '$99.00' },
];

const tableColumns = [
  { header: 'Product Name', accessorKey: 'name' as const },
  { header: 'Price', accessorKey: 'price' as const },
  { 
    header: 'Status', 
    accessorKey: 'status' as const,
    cell: (row: any) => (
      <Badge variant={row.status === 'Active' ? 'default' : 'secondary'}>
        {row.status}
      </Badge>
    ) 
  },
];

const chartData = [
  { name: 'Mon', value: 30 },
  { name: 'Tue', value: 45 },
  { name: 'Wed', value: 35 },
  { name: 'Thu', value: 60 },
  { name: 'Fri', value: 55 },
];

export default function PreviewPage() {
  const [date, setDate] = React.useState<Date | undefined>();
  return (
    <PublicLayout>
      <div className="pt-24 pb-20">
        <PageWrapper className="container mx-auto px-6 max-w-6xl font-poppins">
          <PageHeader 
            title="Component Preview" 
            description="Explore and test all the reusable components available in the Shakta Starter Kit."
          />

          <Tabs defaultValue="ui" className="w-full">
            <TabsList className="mb-8 w-full justify-start overflow-x-auto">
              <TabsTrigger value="ui">Core UI</TabsTrigger>
              <TabsTrigger value="forms">Forms & Inputs</TabsTrigger>
              <TabsTrigger value="data">Data & Charts</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="ui" className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Buttons */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold border-b pb-2">Buttons</h3>
                <div className="flex flex-wrap gap-4">
                  <Button>Primary Button</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link</Button>
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon"><Plus className="size-4" /></Button>
                </div>
              </section>

              {/* Cards */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold border-b pb-2">Cards</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Card Title</CardTitle>
                      <CardDescription>This is a standard card component.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">Main content area for the card component.</p>
                    </CardContent>
                    <CardFooter className="justify-between">
                      <Button variant="outline">Cancel</Button>
                      <Button>Confirm</Button>
                    </CardFooter>
                  </Card>
                  
                  <StatsCard 
                    title="Active Users" 
                    value="2,345" 
                    description="vs last 7 days" 
                    icon={Users} 
                    trend="up" 
                    trendValue="+14%" 
                  />
                </div>
              </section>

              {/* Badges */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold border-b pb-2">Badges</h3>
                <div className="flex flex-wrap gap-4">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="forms" className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="grid lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold border-b pb-2">Inputs & Date</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Standard Input</label>
                      <Input placeholder="Type something..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date Picker</label>
                      <DatePicker date={date} setDate={setDate} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Input with Icon</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-10" placeholder="Search..." />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-bold border-b pb-2">Toggles</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Switch Toggle</label>
                      <Switch />
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox id="terms" />
                      <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Accept terms and conditions
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="data" className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="space-y-6">
                <h3 className="text-xl font-bold border-b pb-2">Charts</h3>
                <div className="grid lg:grid-cols-2 gap-6">
                  <LineChart title="Revenue Flow" data={chartData} />
                  <BarChart title="User Growth" data={chartData} />
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center justify-between border-b pb-2 mb-4">
                  <h3 className="text-xl font-bold">Tables with Pagination</h3>
                  <Badge>Functional</Badge>
                </div>
                <DataTable data={[...tableData, ...tableData, ...tableData]} columns={tableColumns} searchKey="name" />
              </section>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <PreviewFeedback />
            </TabsContent>
          </Tabs>
        </PageWrapper>
      </div>
    </PublicLayout>
  );
}

function PreviewFeedback() {
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [showLoader, setShowLoader] = React.useState(false);

  const handleShowLoader = () => {
    setShowLoader(true);
    setTimeout(() => setShowLoader(false), 3000);
  };

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <h3 className="text-xl font-bold border-b pb-2">Modals & Dialogs</h3>
        <div className="flex gap-4">
          <Button variant="destructive" onClick={() => setShowConfirm(true)}>
            Open Delete Alert
          </Button>
          <ConfirmDialog
            isOpen={showConfirm}
            onClose={() => setShowConfirm(false)}
            onConfirm={() => {
              toast.success('Successfully deleted');
              setShowConfirm(false);
            }}
            title="Delete this project?"
            description="All data associated with this project will be permanently removed. This action cannot be undone."
          />
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xl font-bold border-b pb-2">Alerts</h3>
        <div className="grid gap-4">
          <Alert variant="info" title="Information">
            Check out our newest documentation for setup.
          </Alert>
          <Alert variant="success" title="Success">
            Your changes have been saved successfully.
          </Alert>
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xl font-bold border-b pb-2">Loaders & Fullscreen</h3>
        <div className="flex items-center gap-8">
          <Spinner size="md" />
          <Button variant="outline" onClick={handleShowLoader}>
            Test Fullscreen Loader (3s)
          </Button>
          {showLoader && <FullscreenLoader label="Authenticating your session..." />}
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xl font-bold border-b pb-2">Toast Notifications</h3>
        <div className="flex gap-4">
          <Button onClick={() => toast.success('Action successful!')}>Success Toast</Button>
          <Button onClick={() => toast.error('Something went wrong.')}>Error Toast</Button>
        </div>
      </section>
    </div>
  );
}
