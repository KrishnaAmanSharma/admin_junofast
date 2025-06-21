import type { IStorage } from "./storage";
import type {
  ServiceType,
  InsertServiceType,
  Profile,
  Order,
  UpdateOrder,
  CommonItem,
  InsertCommonItem,
  ServiceQuestion,
  InsertServiceQuestion,
  CommonItemInOrder,
  CustomItem,
  OrderQuestionAnswer,
} from "@shared/schema";

// Mock data for demonstration
let serviceTypes: ServiceType[] = [
  {
    id: "st-1",
    name: "House Relocation",
    description: "Complete household moving service including packing, transportation, and unpacking",
    imageUrl: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "st-2",
    name: "Office Relocation",
    description: "Professional office moving service with minimal downtime",
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "st-3",
    name: "Vehicle Transportation",
    description: "Safe and secure vehicle transportation service",
    imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

let profiles: Profile[] = [
  {
    id: "user-1",
    email: "john.smith@example.com",
    fullName: "John Smith",
    phoneNumber: "+91 9876543210",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "user-2",
    email: "sarah.wilson@example.com",
    fullName: "Sarah Wilson",
    phoneNumber: "+91 9876543211",
    avatarUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b739?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    id: "user-3",
    email: "mike.johnson@example.com",
    fullName: "Mike Johnson",
    phoneNumber: "+91 9876543212",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
];

let orders: Order[] = [
  {
    id: "order-1",
    userId: "user-1",
    serviceType: "House Relocation",
    pickupAddress: "123 Main St, Sector 15, Gurgaon, Haryana",
    pickupPincode: "122001",
    pickupLatitude: 28.4595,
    pickupLongitude: 77.0266,
    dropAddress: "456 Oak Ave, Koramangala, Bangalore, Karnataka",
    dropPincode: "560034",
    status: "Pending",
    approxPrice: "25000",
    createdAt: new Date("2024-12-15"),
    updatedAt: new Date("2024-12-15"),
  },
  {
    id: "order-2",
    userId: "user-2",
    serviceType: "Office Relocation",
    pickupAddress: "789 Business Park, Cyber City, Gurgaon, Haryana",
    pickupPincode: "122002",
    pickupLatitude: 28.4949,
    pickupLongitude: 77.0787,
    dropAddress: "321 Tech Hub, Whitefield, Bangalore, Karnataka",
    dropPincode: "560066",
    status: "In Progress",
    approxPrice: "150000",
    createdAt: new Date("2024-12-10"),
    updatedAt: new Date("2024-12-12"),
  },
  {
    id: "order-3",
    userId: "user-3",
    serviceType: "Vehicle Transportation",
    pickupAddress: "555 Residential Colony, Dwarka, Delhi",
    pickupPincode: "110075",
    pickupLatitude: 28.5921,
    pickupLongitude: 77.0460,
    dropAddress: "777 New Area, Electronic City, Bangalore, Karnataka",
    dropPincode: "560100",
    status: "Price Updated",
    approxPrice: "8000",
    createdAt: new Date("2024-12-18"),
    updatedAt: new Date("2024-12-19"),
  },
  {
    id: "order-4",
    userId: "user-1",
    serviceType: "House Relocation",
    pickupAddress: "888 Garden View, Indiranagar, Bangalore, Karnataka",
    pickupPincode: "560038",
    pickupLatitude: 12.9716,
    pickupLongitude: 77.5946,
    dropAddress: "999 Lake Side, Hitech City, Hyderabad, Telangana",
    dropPincode: "500081",
    status: "Completed",
    approxPrice: "32000",
    createdAt: new Date("2024-11-28"),
    updatedAt: new Date("2024-12-05"),
  },
];

let commonItems: CommonItem[] = [
  {
    id: "item-1",
    serviceTypeId: "st-1",
    name: "Sofa Set",
    description: "3-seater sofa set with cushions",
    imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "item-2",
    serviceTypeId: "st-1",
    name: "Dining Table",
    description: "6-seater wooden dining table with chairs",
    imageUrl: "https://images.unsplash.com/photo-1549497538-303791108f95?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "item-3",
    serviceTypeId: "st-2",
    name: "Office Desk",
    description: "Executive office desk with drawers",
    imageUrl: "https://images.unsplash.com/photo-1541558869434-2840d308329a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "item-4",
    serviceTypeId: "st-1",
    name: "Refrigerator",
    description: "Double door refrigerator",
    imageUrl: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

let serviceQuestions: ServiceQuestion[] = [
  {
    id: "q-1",
    serviceTypeId: "st-1",
    question: "How many rooms need to be packed?",
    questionType: "number",
    isRequired: true,
    displayOrder: 1,
    options: null,
    parentQuestionId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "q-2",
    serviceTypeId: "st-1",
    question: "Do you need packing materials?",
    questionType: "boolean",
    isRequired: true,
    displayOrder: 2,
    options: null,
    parentQuestionId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "q-3",
    serviceTypeId: "st-2",
    question: "Number of workstations to relocate?",
    questionType: "number",
    isRequired: true,
    displayOrder: 1,
    options: null,
    parentQuestionId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

let commonItemsInOrders: CommonItemInOrder[] = [
  {
    id: "cio-1",
    orderId: "order-1",
    itemId: "item-1",
    name: "Sofa Set",
    quantity: 1,
    description: "3-seater sofa set with cushions",
    imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
    createdAt: new Date(),
  },
  {
    id: "cio-2",
    orderId: "order-1",
    itemId: "item-2",
    name: "Dining Table",
    quantity: 1,
    description: "6-seater wooden dining table with chairs",
    imageUrl: "https://images.unsplash.com/photo-1549497538-303791108f95?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
    createdAt: new Date(),
  },
];

let customItems: CustomItem[] = [
  {
    id: "custom-1",
    orderId: "order-1",
    name: "Antique Vase",
    description: "Fragile antique vase from 1920s",
    quantity: 1,
    createdAt: new Date(),
  },
];

let orderQuestionAnswers: OrderQuestionAnswer[] = [
  {
    id: "qa-1",
    orderId: "order-1",
    questionId: "q-1",
    question: "How many rooms need to be packed?",
    answer: "3",
    questionType: "number",
    parentQuestionId: null,
    additionalData: null,
    createdAt: new Date(),
  },
  {
    id: "qa-2",
    orderId: "order-1",
    questionId: "q-2",
    question: "Do you need packing materials?",
    answer: "true",
    questionType: "boolean",
    parentQuestionId: null,
    additionalData: null,
    createdAt: new Date(),
  },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export class MockStorage implements IStorage {
  async getServiceTypes(): Promise<ServiceType[]> {
    return [...serviceTypes].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getServiceType(id: string): Promise<ServiceType | undefined> {
    return serviceTypes.find(st => st.id === id);
  }

  async createServiceType(serviceType: InsertServiceType): Promise<ServiceType> {
    const newServiceType: ServiceType = {
      id: generateId(),
      ...serviceType,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    serviceTypes.push(newServiceType);
    return newServiceType;
  }

  async updateServiceType(id: string, serviceType: Partial<InsertServiceType>): Promise<ServiceType> {
    const index = serviceTypes.findIndex(st => st.id === id);
    if (index === -1) throw new Error("Service type not found");
    
    serviceTypes[index] = {
      ...serviceTypes[index],
      ...serviceType,
      updatedAt: new Date(),
    };
    return serviceTypes[index];
  }

  async deleteServiceType(id: string): Promise<void> {
    const index = serviceTypes.findIndex(st => st.id === id);
    if (index === -1) throw new Error("Service type not found");
    serviceTypes.splice(index, 1);
  }

  async getCommonItems(serviceTypeId?: string): Promise<CommonItem[]> {
    let items = [...commonItems];
    if (serviceTypeId) {
      items = items.filter(item => item.serviceTypeId === serviceTypeId);
    }
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getCommonItem(id: string): Promise<CommonItem | undefined> {
    return commonItems.find(item => item.id === id);
  }

  async createCommonItem(item: InsertCommonItem): Promise<CommonItem> {
    const newItem: CommonItem = {
      id: generateId(),
      ...item,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    commonItems.push(newItem);
    return newItem;
  }

  async updateCommonItem(id: string, item: Partial<InsertCommonItem>): Promise<CommonItem> {
    const index = commonItems.findIndex(ci => ci.id === id);
    if (index === -1) throw new Error("Common item not found");
    
    commonItems[index] = {
      ...commonItems[index],
      ...item,
      updatedAt: new Date(),
    };
    return commonItems[index];
  }

  async deleteCommonItem(id: string): Promise<void> {
    const index = commonItems.findIndex(ci => ci.id === id);
    if (index === -1) throw new Error("Common item not found");
    commonItems.splice(index, 1);
  }

  async getServiceQuestions(serviceTypeId?: string): Promise<ServiceQuestion[]> {
    let questions = [...serviceQuestions];
    if (serviceTypeId) {
      questions = questions.filter(q => q.serviceTypeId === serviceTypeId);
    }
    return questions.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getServiceQuestion(id: string): Promise<ServiceQuestion | undefined> {
    return serviceQuestions.find(q => q.id === id);
  }

  async createServiceQuestion(question: InsertServiceQuestion): Promise<ServiceQuestion> {
    const newQuestion: ServiceQuestion = {
      id: generateId(),
      ...question,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    serviceQuestions.push(newQuestion);
    return newQuestion;
  }

  async updateServiceQuestion(id: string, question: Partial<InsertServiceQuestion>): Promise<ServiceQuestion> {
    const index = serviceQuestions.findIndex(q => q.id === id);
    if (index === -1) throw new Error("Service question not found");
    
    serviceQuestions[index] = {
      ...serviceQuestions[index],
      ...question,
      updatedAt: new Date(),
    };
    return serviceQuestions[index];
  }

  async deleteServiceQuestion(id: string): Promise<void> {
    const index = serviceQuestions.findIndex(q => q.id === id);
    if (index === -1) throw new Error("Service question not found");
    serviceQuestions.splice(index, 1);
  }

  async getOrders(filters?: { status?: string; serviceType?: string; limit?: number }): Promise<Order[]> {
    let filteredOrders = [...orders];
    
    if (filters?.status && filters.status !== "All Status") {
      filteredOrders = filteredOrders.filter(order => order.status === filters.status);
    }
    if (filters?.serviceType && filters.serviceType !== "All Services") {
      filteredOrders = filteredOrders.filter(order => order.serviceType === filters.serviceType);
    }

    filteredOrders.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

    if (filters?.limit) {
      filteredOrders = filteredOrders.slice(0, filters.limit);
    }

    return filteredOrders;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return orders.find(order => order.id === id);
  }

  async updateOrder(id: string, updates: Partial<UpdateOrder>): Promise<Order> {
    const index = orders.findIndex(order => order.id === id);
    if (index === -1) throw new Error("Order not found");
    
    orders[index] = {
      ...orders[index],
      ...updates,
      updatedAt: new Date(),
    };
    return orders[index];
  }

  async getOrderDetails(id: string): Promise<{
    order: Order;
    profile: Profile | null;
    commonItems: CommonItemInOrder[];
    customItems: CustomItem[];
    questionAnswers: OrderQuestionAnswer[];
    orderDetails: any[];
  }> {
    const order = await this.getOrder(id);
    if (!order) throw new Error("Order not found");

    const profile = order.userId ? profiles.find(p => p.id === order.userId) || null : null;
    const orderCommonItems = commonItemsInOrders.filter(ci => ci.orderId === id);
    const orderCustomItems = customItems.filter(ci => ci.orderId === id);
    const orderQuestionAnswers = orderQuestionAnswers.filter(qa => qa.orderId === id);

    return {
      order,
      profile,
      commonItems: orderCommonItems,
      customItems: orderCustomItems,
      questionAnswers: orderQuestionAnswers,
      orderDetails: [], // Mock storage returns empty array for order details
    };
  }

  async getProfiles(search?: string): Promise<Profile[]> {
    let filteredProfiles = [...profiles];
    
    if (search) {
      filteredProfiles = filteredProfiles.filter(profile =>
        profile.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        profile.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    return filteredProfiles.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getProfile(id: string): Promise<Profile | undefined> {
    return profiles.find(profile => profile.id === id);
  }

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
    const index = profiles.findIndex(profile => profile.id === id);
    if (index === -1) throw new Error("Profile not found");
    
    profiles[index] = {
      ...profiles[index],
      ...updates,
      updatedAt: new Date(),
    };
    return profiles[index];
  }

  async getDashboardMetrics(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    activeOrders: number;
    newUsers: number;
  }> {
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter(order => order.status === "Completed")
      .reduce((sum, order) => sum + Number(order.approxPrice || 0), 0);
    const activeOrders = orders.filter(order => order.status === "In Progress").length;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = profiles.filter(profile => 
      profile.createdAt && new Date(profile.createdAt) >= thirtyDaysAgo
    ).length;

    return {
      totalOrders,
      totalRevenue,
      activeOrders,
      newUsers,
    };
  }

  async getRecentOrdersRequiringAttention(): Promise<Array<Order & { profile: Profile | null }>> {
    const pendingOrders = orders
      .filter(order => order.status === "Pending")
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, 5);

    return pendingOrders.map(order => ({
      ...order,
      profile: order.userId ? profiles.find(p => p.id === order.userId) || null : null,
    }));
  }
}