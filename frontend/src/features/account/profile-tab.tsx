'use client';

import * as React from 'react';
import { AuthUser } from '@/src/types';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Shield, CheckCircle2, User, Mail, Phone, Building, MapPin, Edit3, Key, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { updateProfile } from '@/src/lib/auth';

interface ProfileTabProps {
  user: AuthUser;
  onRefresh: () => void;
}

export function ProfileTab({ user, onRefresh }: ProfileTabProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  
  const [formData, setFormData] = React.useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    company_name: user.company_name || '',
    address: user.address || '',
    password: '',
    password_confirmation: '',
  });

  // Sync state if user changes
  React.useEffect(() => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      company_name: user.company_name || '',
      address: user.address || '',
      password: '',
      password_confirmation: '',
    });
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (formData.password && formData.password !== formData.password_confirmation) {
          toast.error("Passwords do not match");
          setIsSaving(false);
          return;
      }
      await updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        company_name: formData.company_name || null,
        address: formData.address || null,
        password: formData.password || null,
        password_confirmation: formData.password_confirmation || null,
      });
      toast.success('Profile updated successfully');
      setIsEditing(false);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* LEFT COLUMN: Sidebar Info Cards */}
      <div className="space-y-6">
        {/* Partnership / Wholesale Status Card */}
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden rounded-3xl bg-white relative">
          <div className="h-2 bg-gradient-to-r from-[#966FD6] to-[#b196ea]" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4 text-[#966FD6]">
              <div className="w-8 h-8 rounded-xl bg-[#966FD6]/10 flex items-center justify-center shrink-0">
                <Building className="w-4 h-4" />
              </div>
              <h3 className="font-black text-xs uppercase tracking-widest">Partner Portal</h3>
            </div>

            <div className="space-y-4">
              <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100/50">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Account Tier</p>
                <p className="font-black text-black">
                  {user.wholeseller_status === 'approved' ? 'Wholesale Partner' : 'Standard Member'}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100/50">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Order Benefits</p>
                <ul className="text-xs text-zinc-500 font-medium space-y-1.5 mt-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Bulk volume pricing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Priority order fulfilment</span>
                  </li>
                  {user.wholeseller_status === 'approved' && (
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Dedicated Account Manager</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Settings Card */}
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-zinc-800">
              <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-zinc-500" />
              </div>
              <h3 className="font-black text-xs uppercase tracking-widest">Security</h3>
            </div>
            {!isEditing && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-[10px] font-black uppercase tracking-widest text-[#966FD6] hover:bg-[#966FD6]/5 h-8 rounded-lg cursor-pointer flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </Button>
            )}
          </div>
          <div className="space-y-3">
            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
              Your personal information is secure. To update your password or edit account parameters, click the edit button.
            </p>
            {user.updated_at && (
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase tracking-wide bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-100/50 w-fit">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Updated: {new Date(user.updated_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* RIGHT COLUMN: Profile Information / Edit Form */}
      <div className="lg:col-span-2">
        {isEditing ? (
          <Card className="border border-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-zinc-50/50 px-8 py-6 border-b border-zinc-100">
              <CardTitle className="text-lg font-black text-black uppercase tracking-wider">Update Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <Input 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        className="h-12 rounded-xl bg-zinc-50/50 pl-11 border-zinc-200/60 focus:border-[#966FD6] focus:ring-1 focus:ring-[#966FD6]/30 font-medium transition-all" 
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <Input 
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                        className="h-12 rounded-xl bg-zinc-50/50 pl-11 border-zinc-200/60 focus:border-[#966FD6] focus:ring-1 focus:ring-[#966FD6]/30 font-medium transition-all" 
                        required 
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <Input 
                        value={formData.phone} 
                        onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                        className="h-12 rounded-xl bg-zinc-50/50 pl-11 border-zinc-200/60 focus:border-[#966FD6] focus:ring-1 focus:ring-[#966FD6]/30 font-medium transition-all" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Company Name</label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <Input 
                        value={formData.company_name} 
                        onChange={(e) => setFormData({...formData, company_name: e.target.value})} 
                        className="h-12 rounded-xl bg-zinc-50/50 pl-11 border-zinc-200/60 focus:border-[#966FD6] focus:ring-1 focus:ring-[#966FD6]/30 font-medium transition-all" 
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Shipping & Billing Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 w-4 h-4 text-zinc-400" />
                    <textarea 
                      value={formData.address} 
                      onChange={(e) => setFormData({...formData, address: e.target.value})} 
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-50/50 border border-zinc-200/60 hover:border-zinc-300 focus:border-[#966FD6] focus:ring-1 focus:ring-[#966FD6]/30 outline-none h-24 resize-none text-sm font-medium transition-all" 
                    />
                  </div>
                </div>
                
                <div className="pt-6 border-t border-zinc-100">
                  <p className="text-[10px] font-black text-[#966FD6] uppercase tracking-widest mb-4 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" />
                    Change Password (leave blank to keep current)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">New Password</label>
                      <Input 
                        type="password" 
                        value={formData.password} 
                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                        className="h-12 rounded-xl bg-zinc-50/50 border-zinc-200/60 focus:border-[#966FD6] focus:ring-1 focus:ring-[#966FD6]/30" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                      <Input 
                        type="password" 
                        value={formData.password_confirmation} 
                        onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})} 
                        className="h-12 rounded-xl bg-zinc-50/50 border-zinc-200/60 focus:border-[#966FD6] focus:ring-1 focus:ring-[#966FD6]/30" 
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-50">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsEditing(false)} 
                    className="rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSaving} 
                    className="rounded-xl bg-black text-white hover:bg-zinc-900 px-8 font-black text-[10px] uppercase tracking-widest cursor-pointer shadow-md transition-all duration-300 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Grid display of details cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card: Display Name */}
              <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-start gap-4 hover:shadow-[0_12px_45px_rgb(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-2xl bg-[#966FD6]/10 flex items-center justify-center shrink-0 text-[#966FD6] group-hover:scale-105 transition-transform">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Display Name</p>
                  <p className="font-bold text-black text-base leading-tight">{user.name}</p>
                </div>
              </div>

              {/* Card: Email */}
              <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-start gap-4 hover:shadow-[0_12px_45px_rgb(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-2xl bg-[#966FD6]/10 flex items-center justify-center shrink-0 text-[#966FD6] group-hover:scale-105 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Email Address</p>
                  <p className="font-bold text-black text-base leading-tight truncate">{user.email}</p>
                </div>
              </div>

              {/* Card: Phone */}
              <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-start gap-4 hover:shadow-[0_12px_45px_rgb(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-2xl bg-[#966FD6]/10 flex items-center justify-center shrink-0 text-[#966FD6] group-hover:scale-105 transition-transform">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Contact Number</p>
                  <p className="font-bold text-black text-base leading-tight">{user.phone || 'Not provided'}</p>
                </div>
              </div>

              {/* Card: Company */}
              <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-start gap-4 hover:shadow-[0_12px_45px_rgb(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-2xl bg-[#966FD6]/10 flex items-center justify-center shrink-0 text-[#966FD6] group-hover:scale-105 transition-transform">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Company Name</p>
                  <p className="font-bold text-black text-base leading-tight">{user.company_name || 'Not provided'}</p>
                </div>
              </div>

              {/* Card: Default Address */}
              <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-start gap-4 hover:shadow-[0_12px_45px_rgb(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 group md:col-span-2">
                <div className="w-10 h-10 rounded-2xl bg-[#966FD6]/10 flex items-center justify-center shrink-0 text-[#966FD6] group-hover:scale-105 transition-transform">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Default Shipping Address</p>
                  <p className="font-bold text-black text-sm leading-relaxed">{user.address || 'Address is currently blank. Please edit your profile to add a shipping address.'}</p>
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={() => setIsEditing(true)}
                className="rounded-xl bg-black text-white hover:bg-zinc-900 px-6 h-12 font-black text-[10px] uppercase tracking-widest gap-2 flex items-center shadow-lg shadow-zinc-100 cursor-pointer hover:shadow-xl transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Profile Details
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
