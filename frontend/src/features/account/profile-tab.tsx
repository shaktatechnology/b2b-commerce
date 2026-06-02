'use client';

import * as React from 'react';
import { AuthUser } from '@/src/types';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Shield } from 'lucide-react';
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
      {/* Sidebar Cards */}
      <div className="space-y-6">
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden rounded-3xl">
          <div className="h-24 bg-gradient-to-r from-[#966FD6] to-[#7c52c9]" />
          <CardContent className="pt-0 -mt-12 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white shadow-xl border-4 border-white mb-4">
              <span className="text-3xl font-black text-[#966FD6]">
                {user.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-black text-black mb-1">{user.name}</h2>
            <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest">{user.role || 'Member'}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 text-[#966FD6]">
              <Shield className="w-5 h-5" />
              <h3 className="font-black text-sm uppercase tracking-widest">Security</h3>
            </div>
            {!isEditing && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-[10px] font-black uppercase tracking-widest text-[#966FD6] hover:bg-[#966FD6]/5 h-8"
              >
                Settings
              </Button>
            )}
          </div>
          <p className="text-xs text-zinc-400 font-medium leading-relaxed">
            Your account is protected. Last activity logged {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : '—'}.
          </p>
        </Card>
      </div>

      {/* Profile Form/Info */}
      <div className="lg:col-span-2">
        {isEditing ? (
          <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-zinc-50/50 px-8 py-8 border-b border-zinc-100">
              <CardTitle className="text-xl font-black text-black">Edit Information</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Full Name</label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-12 rounded-xl bg-zinc-50/50" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Email</label>
                    <Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-12 rounded-xl bg-zinc-50/50" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Phone</label>
                    <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="h-12 rounded-xl bg-zinc-50/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Company Name</label>
                    <Input value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value})} className="h-12 rounded-xl bg-zinc-50/50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Address</label>
                  <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full p-4 rounded-xl bg-zinc-50/50 border border-zinc-100 outline-none h-24 resize-none" />
                </div>
                
                <div className="pt-4 border-t border-zinc-100">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Change Password (leave blank to keep current)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">New Password</label>
                      <Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="h-12 rounded-xl bg-zinc-50/50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Confirm Password</label>
                      <Input type="password" value={formData.password_confirmation} onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})} className="h-12 rounded-xl bg-zinc-50/50" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6">
                  <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="rounded-xl font-black text-[10px] uppercase">Cancel</Button>
                  <Button type="submit" disabled={isSaving} className="rounded-xl bg-black text-white px-8 font-black text-[10px] uppercase tracking-widest">
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] p-10 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Display Name</p>
                  <p className="text-lg font-bold text-black">{user.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Email Address</p>
                  <p className="text-lg font-bold text-black">{user.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Contact</p>
                  <p className="text-lg font-bold text-black">{user.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Company</p>
                  <p className="text-lg font-bold text-black">{user.company_name || '—'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Default Address</p>
                  <p className="text-lg font-bold text-black leading-relaxed">{user.address || '—'}</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
