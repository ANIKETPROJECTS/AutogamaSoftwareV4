import { Customer, Job, Technician, Inventory, Appointment, WhatsAppTemplate } from './models';
import type { ICustomer, IJob, ITechnician, IInventoryItem, IAppointment, IWhatsAppTemplate, JobStage } from './models';
import mongoose from 'mongoose';

export interface IStorage {
  getCustomers(): Promise<ICustomer[]>;
  getCustomer(id: string): Promise<ICustomer | null>;
  searchCustomers(query: string): Promise<ICustomer[]>;
  createCustomer(data: Partial<ICustomer>): Promise<ICustomer>;
  updateCustomer(id: string, data: Partial<ICustomer>): Promise<ICustomer | null>;
  addVehicleToCustomer(customerId: string, vehicle: any): Promise<ICustomer | null>;
  
  getJobs(): Promise<IJob[]>;
  getJob(id: string): Promise<IJob | null>;
  getJobsByCustomer(customerId: string): Promise<IJob[]>;
  getJobsByStage(stage: JobStage): Promise<IJob[]>;
  createJob(data: Partial<IJob>): Promise<IJob>;
  updateJob(id: string, data: Partial<IJob>): Promise<IJob | null>;
  updateJobStage(id: string, stage: JobStage): Promise<IJob | null>;
  
  getTechnicians(): Promise<ITechnician[]>;
  getTechnician(id: string): Promise<ITechnician | null>;
  createTechnician(data: Partial<ITechnician>): Promise<ITechnician>;
  updateTechnician(id: string, data: Partial<ITechnician>): Promise<ITechnician | null>;
  getTechnicianWorkload(): Promise<{ technician: ITechnician; jobCount: number }[]>;
  
  getInventory(): Promise<IInventoryItem[]>;
  getInventoryItem(id: string): Promise<IInventoryItem | null>;
  createInventoryItem(data: Partial<IInventoryItem>): Promise<IInventoryItem>;
  updateInventoryItem(id: string, data: Partial<IInventoryItem>): Promise<IInventoryItem | null>;
  adjustInventory(id: string, quantity: number): Promise<IInventoryItem | null>;
  getLowStockItems(): Promise<IInventoryItem[]>;
  
  getAppointments(): Promise<IAppointment[]>;
  getAppointmentsByDate(date: Date): Promise<IAppointment[]>;
  createAppointment(data: Partial<IAppointment>): Promise<IAppointment>;
  updateAppointment(id: string, data: Partial<IAppointment>): Promise<IAppointment | null>;
  convertAppointmentToJob(appointmentId: string): Promise<IJob | null>;
  
  getWhatsAppTemplates(): Promise<IWhatsAppTemplate[]>;
  updateWhatsAppTemplate(stage: JobStage, message: string, isActive: boolean): Promise<IWhatsAppTemplate | null>;
  
  getDashboardStats(): Promise<{
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    pendingPayments: number;
    totalRevenue: number;
    jobsByStage: { stage: string; count: number }[];
  }>;
}

export class MongoStorage implements IStorage {
  async getCustomers(): Promise<ICustomer[]> {
    return Customer.find().sort({ createdAt: -1 });
  }

  async getCustomer(id: string): Promise<ICustomer | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Customer.findById(id);
  }

  async searchCustomers(query: string): Promise<ICustomer[]> {
    const regex = new RegExp(query, 'i');
    return Customer.find({
      $or: [
        { name: regex },
        { phone: regex },
        { 'vehicles.plateNumber': regex }
      ]
    });
  }

  async createCustomer(data: Partial<ICustomer>): Promise<ICustomer> {
    const customer = new Customer(data);
    return customer.save();
  }

  async updateCustomer(id: string, data: Partial<ICustomer>): Promise<ICustomer | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Customer.findByIdAndUpdate(id, data, { new: true });
  }

  async addVehicleToCustomer(customerId: string, vehicle: any): Promise<ICustomer | null> {
    if (!mongoose.Types.ObjectId.isValid(customerId)) return null;
    return Customer.findByIdAndUpdate(
      customerId,
      { $push: { vehicles: vehicle } },
      { new: true }
    );
  }

  async getJobs(): Promise<IJob[]> {
    return Job.find().sort({ updatedAt: -1 });
  }

  async getJob(id: string): Promise<IJob | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Job.findById(id);
  }

  async getJobsByCustomer(customerId: string): Promise<IJob[]> {
    if (!mongoose.Types.ObjectId.isValid(customerId)) return [];
    return Job.find({ customerId }).sort({ createdAt: -1 });
  }

  async getJobsByStage(stage: JobStage): Promise<IJob[]> {
    return Job.find({ stage }).sort({ updatedAt: -1 });
  }

  async createJob(data: Partial<IJob>): Promise<IJob> {
    const job = new Job(data);
    return job.save();
  }

  async updateJob(id: string, data: Partial<IJob>): Promise<IJob | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Job.findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true });
  }

  async updateJobStage(id: string, stage: JobStage): Promise<IJob | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Job.findByIdAndUpdate(id, { stage, updatedAt: new Date() }, { new: true });
  }

  async getTechnicians(): Promise<ITechnician[]> {
    return Technician.find().sort({ name: 1 });
  }

  async getTechnician(id: string): Promise<ITechnician | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Technician.findById(id);
  }

  async createTechnician(data: Partial<ITechnician>): Promise<ITechnician> {
    const technician = new Technician(data);
    return technician.save();
  }

  async updateTechnician(id: string, data: Partial<ITechnician>): Promise<ITechnician | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Technician.findByIdAndUpdate(id, data, { new: true });
  }

  async getTechnicianWorkload(): Promise<{ technician: ITechnician; jobCount: number }[]> {
    const technicians = await Technician.find();
    const workloads = await Promise.all(
      technicians.map(async (tech) => {
        const jobCount = await Job.countDocuments({
          technicianId: tech._id,
          stage: { $nin: ['Completed', 'Cancelled'] }
        });
        return { technician: tech, jobCount };
      })
    );
    return workloads;
  }

  async getInventory(): Promise<IInventoryItem[]> {
    return Inventory.find().sort({ category: 1, name: 1 });
  }

  async getInventoryItem(id: string): Promise<IInventoryItem | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Inventory.findById(id);
  }

  async createInventoryItem(data: Partial<IInventoryItem>): Promise<IInventoryItem> {
    const item = new Inventory(data);
    return item.save();
  }

  async updateInventoryItem(id: string, data: Partial<IInventoryItem>): Promise<IInventoryItem | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Inventory.findByIdAndUpdate(id, data, { new: true });
  }

  async adjustInventory(id: string, quantity: number): Promise<IInventoryItem | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Inventory.findByIdAndUpdate(id, { $inc: { quantity } }, { new: true });
  }

  async getLowStockItems(): Promise<IInventoryItem[]> {
    return Inventory.find({
      $expr: { $lte: ['$quantity', '$minStock'] }
    });
  }

  async getAppointments(): Promise<IAppointment[]> {
    return Appointment.find().sort({ date: 1, timeSlot: 1 });
  }

  async getAppointmentsByDate(date: Date): Promise<IAppointment[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return Appointment.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ timeSlot: 1 });
  }

  async createAppointment(data: Partial<IAppointment>): Promise<IAppointment> {
    const appointment = new Appointment(data);
    return appointment.save();
  }

  async updateAppointment(id: string, data: Partial<IAppointment>): Promise<IAppointment | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Appointment.findByIdAndUpdate(id, data, { new: true });
  }

  async convertAppointmentToJob(appointmentId: string): Promise<IJob | null> {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return null;

    let customer = await Customer.findOne({ phone: appointment.customerPhone });
    if (!customer) {
      const newCustomer = new Customer({
        name: appointment.customerName,
        phone: appointment.customerPhone,
        vehicles: [{
          make: '',
          model: appointment.vehicleInfo,
          year: '',
          plateNumber: appointment.plateNumber,
          color: ''
        }]
      });
      customer = await newCustomer.save();
    }

    const job = await this.createJob({
      customerId: customer._id as mongoose.Types.ObjectId,
      vehicleIndex: 0,
      customerName: customer.name,
      vehicleName: appointment.vehicleInfo,
      plateNumber: appointment.plateNumber,
      stage: 'New Lead',
      notes: `${appointment.serviceType}${appointment.notes ? ' - ' + appointment.notes : ''}`
    });

    await Appointment.findByIdAndUpdate(appointmentId, {
      status: 'Converted',
      jobId: job._id
    });

    return job;
  }

  async getWhatsAppTemplates(): Promise<IWhatsAppTemplate[]> {
    return WhatsAppTemplate.find().sort({ stage: 1 });
  }

  async updateWhatsAppTemplate(stage: JobStage, message: string, isActive: boolean): Promise<IWhatsAppTemplate | null> {
    return WhatsAppTemplate.findOneAndUpdate(
      { stage },
      { message, isActive },
      { new: true, upsert: true }
    );
  }

  async getDashboardStats() {
    const [
      totalJobs,
      activeJobs,
      completedJobs,
      jobsByStage,
      revenueData
    ] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ stage: { $nin: ['Completed', 'Cancelled'] } }),
      Job.countDocuments({ stage: 'Completed' }),
      Job.aggregate([
        { $group: { _id: '$stage', count: { $sum: 1 } } }
      ]),
      Job.aggregate([
        { $match: { stage: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, pending: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } } } }
      ])
    ]);

    return {
      totalJobs,
      activeJobs,
      completedJobs,
      pendingPayments: revenueData[0]?.pending || 0,
      totalRevenue: revenueData[0]?.total || 0,
      jobsByStage: jobsByStage.map(s => ({ stage: s._id, count: s.count }))
    };
  }
}

export const storage = new MongoStorage();
