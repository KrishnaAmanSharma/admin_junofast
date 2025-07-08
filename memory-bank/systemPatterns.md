# System Patterns: Relo Admin Dashboard

## Architecture Patterns

### Frontend Architecture Pattern
**Pattern**: Component-Based Architecture with Hooks
```
Pages → Components → UI Components → Hooks → Services
```

**Implementation:**
- **Pages**: Route-level components (`/pages/orders.tsx`, `/pages/dashboard.tsx`)
- **Components**: Reusable business logic components (`/components/tables/`, `/components/modals/`)
- **UI Components**: Design system components (`/components/ui/`)
- **Hooks**: Custom React hooks for state management (`/hooks/use-toast.ts`)
- **Services**: API clients and utilities (`/lib/supabase-client.ts`)

### Backend Architecture Pattern
**Pattern**: Layered Architecture with Express.js
```
Routes → Controllers → Services → Data Access → Database
```

**Implementation:**
- **Routes**: Express route handlers (`server/routes.ts`)
- **Controllers**: Business logic processing (embedded in routes)
- **Services**: Data transformation and validation
- **Data Access**: Storage abstraction layer (`server/storage.ts`)
- **Database**: Supabase PostgreSQL with dual access patterns

### Data Access Pattern
**Pattern**: Repository Pattern with Dual Implementation
```
React Query → API Routes → Storage Layer → Database Clients → Supabase
```

**Current Implementation Issues:**
- **Dual Database Access**: Both Drizzle ORM and direct Supabase client
- **Inconsistent Patterns**: Some components use direct Supabase, others use API routes
- **Field Mapping**: Constant conversion between snake_case and camelCase

## Component Patterns

### Page Component Pattern
```typescript
// Standard page structure
export default function PageName() {
  const [filters, setFilters] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  
  const { data, isLoading } = useQuery({
    queryKey: ["resource", filters],
    queryFn: () => fetchResource(filters)
  });

  return (
    <div>
      <Header title="Page Title" />
      <div className="p-6 space-y-6">
        <FilterSection />
        <DataTable />
        <Modal />
      </div>
    </div>
  );
}
```

### Modal Component Pattern
```typescript
// Reusable modal structure
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId?: string;
}

export function ItemModal({ isOpen, onClose, itemId }: ModalProps) {
  const { data } = useQuery({
    queryKey: ["item", itemId],
    queryFn: () => fetchItem(itemId),
    enabled: !!itemId
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        {/* Modal content */}
      </DialogContent>
    </Dialog>
  );
}
```

### Table Component Pattern
```typescript
// Data table with actions
interface TableProps<T> {
  data: T[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
}

export function DataTable<T>({ data, isLoading, onEdit, onView }: TableProps<T>) {
  return (
    <Table>
      <TableHeader>
        {/* Column headers */}
      </TableHeader>
      <TableBody>
        {data.map(item => (
          <TableRow key={item.id}>
            {/* Row data with actions */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## Data Flow Patterns

### Query Pattern with React Query
```typescript
// Standard data fetching pattern
const { data: orders, isLoading, error } = useQuery<Order[]>({
  queryKey: ["orders", filters],
  queryFn: async () => {
    const response = await fetch(`/api/orders?${new URLSearchParams(filters)}`);
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
  },
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: false
});
```

### Mutation Pattern with Optimistic Updates
```typescript
// Standard mutation pattern
const updateOrderMutation = useMutation({
  mutationFn: async ({ id, updates }: { id: string; updates: Partial<Order> }) => {
    const response = await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update order');
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    toast({ title: "Order updated successfully" });
  },
  onError: (error) => {
    toast({ title: "Error updating order", variant: "destructive" });
  }
});
```

### State Management Pattern
```typescript
// Local state with URL synchronization
const [filters, setFilters] = useState({
  status: "",
  serviceType: "",
  search: ""
});

// Update URL when filters change
useEffect(() => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
}, [filters]);
```

## Database Patterns

### Schema Definition Pattern (Drizzle)
```typescript
// Table definition with relationships
export const tableName = pgTable("table_name", {
  id: uuid("id").defaultRandom().primaryKey(),
  foreignId: uuid("foreign_id").references(() => otherTable.id),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Type inference
export type TableType = typeof tableName.$inferSelect;
export type InsertTableType = typeof tableName.$inferInsert;
```

### Data Access Pattern (Supabase)
```typescript
// CRUD operations with error handling
export const dataService = {
  async getItems(filters?: FilterType) {
    let query = supabase.from('table_name').select('*');
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    
    return data?.map(item => ({
      // Field mapping from snake_case to camelCase
      id: item.id,
      createdAt: item.created_at,
      // ... other fields
    })) || [];
  },

  async updateItem(id: string, updates: UpdateType) {
    const dbUpdates = {
      // Field mapping from camelCase to snake_case
      updated_at: new Date().toISOString(),
      // ... other fields
    };

    const { data, error } = await supabase
      .from('table_name')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
};
```

## API Patterns

### Express Route Pattern
```typescript
// Standard API route structure
app.get("/api/resource", async (req, res) => {
  try {
    const filters = {
      status: req.query.status as string,
      search: req.query.search as string,
    };

    const data = await storage.getResource(filters);
    res.json(data);
  } catch (error) {
    console.error('Resource fetch error:', error);
    res.status(500).json({ error: "Failed to fetch resource" });
  }
});

app.put("/api/resource/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const result = await storage.updateResource(id, updates);
    res.json(result);
  } catch (error) {
    console.error('Resource update error:', error);
    res.status(500).json({ error: "Failed to update resource" });
  }
});
```

### Error Handling Pattern
```typescript
// Consistent error handling across the application
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Error middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code
    });
  }
  
  console.error('Unexpected error:', error);
  res.status(500).json({ error: 'Internal server error' });
});
```

## UI Patterns

### Form Handling Pattern
```typescript
// React Hook Form with Zod validation
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
});

type FormData = z.infer<typeof formSchema>;

export function ItemForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "" }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

### Loading State Pattern
```typescript
// Consistent loading states
export function LoadingState() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

// Usage in components
if (isLoading) return <LoadingState />;
if (error) return <ErrorState error={error} />;
return <DataComponent data={data} />;
```

### Toast Notification Pattern
```typescript
// Consistent user feedback
const { toast } = useToast();

// Success notification
toast({
  title: "Success",
  description: "Operation completed successfully",
});

// Error notification
toast({
  title: "Error",
  description: "Something went wrong",
  variant: "destructive",
});
```

## Security Patterns

### Input Validation Pattern
```typescript
// Server-side validation with Zod
const updateOrderSchema = z.object({
  status: z.enum(['Pending', 'Confirmed', 'In Progress', 'Completed']),
  approxPrice: z.number().positive().optional(),
});

app.put("/api/orders/:id", async (req, res) => {
  try {
    const validation = updateOrderSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid input", 
        details: validation.error.issues 
      });
    }
    
    // Process validated data
    const result = await storage.updateOrder(req.params.id, validation.data);
    res.json(result);
  } catch (error) {
    // Error handling
  }
});
```

### Authentication Pattern
```typescript
// Supabase authentication check
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const { data: user, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};
```

## Performance Patterns

### Memoization Pattern
```typescript
// Expensive computation memoization
const ExpensiveComponent = memo(({ data }: { data: ComplexData[] }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      computed: expensiveCalculation(item)
    }));
  }, [data]);

  return <div>{/* Render processed data */}</div>;
});
```

### Lazy Loading Pattern
```typescript
// Route-based code splitting
const Dashboard = lazy(() => import('@/pages/dashboard'));
const Orders = lazy(() => import('@/pages/orders'));

function App() {
  return (
    <Suspense fallback={<LoadingState />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/orders" component={Orders} />
      </Switch>
    </Suspense>
  );
}
```

## Critical Implementation Paths

### Order Processing Flow
1. **Order Creation**: Customer creates order → Stored in database
2. **Admin Review**: Admin reviews order details → Sets pricing
3. **Vendor Broadcast**: Order broadcast to qualified vendors
4. **Vendor Response**: Vendors accept/reject or request price changes
5. **Admin Decision**: Admin approves vendor selection
6. **Order Assignment**: Order assigned to selected vendor
7. **Status Updates**: Real-time status tracking through completion

### Vendor Management Flow
1. **Application**: Vendor submits application
2. **Review**: Admin reviews vendor credentials
3. **Approval**: Admin approves/rejects vendor
4. **Onboarding**: Vendor gains access to platform
5. **Performance Tracking**: Ongoing monitoring of vendor metrics

### Data Synchronization Flow
1. **Database Change**: Update occurs in Supabase
2. **Real-time Notification**: Supabase triggers real-time update
3. **Client Update**: React Query invalidates and refetches data
4. **UI Update**: Components re-render with new data
5. **User Notification**: Toast notification confirms change

These patterns form the foundation of the application architecture and should be consistently applied across all new development and refactoring efforts.
