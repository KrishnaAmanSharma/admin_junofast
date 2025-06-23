import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import Dashboard from "@/pages/dashboard";
import Orders from "@/pages/orders";
import Users from "@/pages/users";
import Vendors from "@/pages/vendors";
import ServiceTypes from "@/pages/service-types";
import CommonItems from "@/pages/common-items";
import ServiceQuestions from "@/pages/service-questions";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/orders" component={Orders} />
          <Route path="/users" component={Users} />
          <Route path="/vendors" component={Vendors} />
          <Route path="/service-types" component={ServiceTypes} />
          <Route path="/common-items" component={CommonItems} />
          <Route path="/service-questions" component={ServiceQuestions} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
