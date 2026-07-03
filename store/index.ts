"use client";

import { create } from "zustand";
import type {
  CompanyProfile, PastProject, StaffMember, Equipment, LabourCategory,
} from "@/types";

const uid = () => Math.random().toString(36).slice(2, 10);

const emptyCompanyProfile: CompanyProfile = {
  legalName: "",
  tradeName: "",
  registration: "",
  vatNumber: "",
  established: new Date().getFullYear(),
  headquarters: "",
  website: "",
  description: "",
  tagline: "",
  vision: "",
  bio: "",
  linkedin: "",
  instagram: "",
  twitter: "",
  certifications: [],
  pastProjects: [],
  staff: [],
  equipment: [],
  labour: [],
};

interface CompanyProfileStore {
  profile: CompanyProfile;
  setProfile: (profile: CompanyProfile) => void;
  updateField: <K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) => void;
  addCertification: (cert: string) => void;
  removeCertification: (idx: number) => void;
  addPastProject: (p: Omit<PastProject, "id">) => void;
  updatePastProject: (id: string, p: Partial<PastProject>) => void;
  removePastProject: (id: string) => void;
  addStaff: (s: Omit<StaffMember, "id">) => void;
  updateStaff: (id: string, s: Partial<StaffMember>) => void;
  removeStaff: (id: string) => void;
  addEquipment: (e: Omit<Equipment, "id">) => void;
  updateEquipment: (id: string, e: Partial<Equipment>) => void;
  removeEquipment: (id: string) => void;
  addLabour: (l: Omit<LabourCategory, "id">) => void;
  updateLabour: (id: string, l: Partial<LabourCategory>) => void;
  removeLabour: (id: string) => void;
}

export const useCompanyProfileStore = create<CompanyProfileStore>((set) => ({
  profile: emptyCompanyProfile,

  setProfile: (profile) => set({ profile }),

  updateField: (key, value) =>
    set((s) => ({ profile: { ...s.profile, [key]: value } })),

  addCertification: (cert) =>
    set((s) => ({ profile: { ...s.profile, certifications: [...s.profile.certifications, cert] } })),

  removeCertification: (idx) =>
    set((s) => ({ profile: { ...s.profile, certifications: s.profile.certifications.filter((_, i) => i !== idx) } })),

  addPastProject: (p) =>
    set((s) => ({
      profile: { ...s.profile, pastProjects: [{ ...p, id: (p as PastProject).id || "pp-" + uid() }, ...s.profile.pastProjects] },
    })),

  updatePastProject: (id, p) =>
    set((s) => ({
      profile: { ...s.profile, pastProjects: s.profile.pastProjects.map((x) => (x.id === id ? { ...x, ...p } : x)) },
    })),

  removePastProject: (id) =>
    set((s) => ({ profile: { ...s.profile, pastProjects: s.profile.pastProjects.filter((x) => x.id !== id) } })),

  addStaff: (st) =>
    set((s) => ({
      profile: { ...s.profile, staff: [{ ...st, id: (st as StaffMember).id || "stf-" + uid() }, ...s.profile.staff] },
    })),

  updateStaff: (id, st) =>
    set((s) => ({
      profile: { ...s.profile, staff: s.profile.staff.map((x) => (x.id === id ? { ...x, ...st } : x)) },
    })),

  removeStaff: (id) =>
    set((s) => ({ profile: { ...s.profile, staff: s.profile.staff.filter((x) => x.id !== id) } })),

  addEquipment: (e) =>
    set((s) => ({ profile: { ...s.profile, equipment: [{ ...e, id: (e as Equipment).id || "eq-" + uid() }, ...s.profile.equipment] } })),

  updateEquipment: (id, e) =>
    set((s) => ({
      profile: { ...s.profile, equipment: s.profile.equipment.map((x) => (x.id === id ? { ...x, ...e } : x)) },
    })),

  removeEquipment: (id) =>
    set((s) => ({ profile: { ...s.profile, equipment: s.profile.equipment.filter((x) => x.id !== id) } })),

  addLabour: (l) =>
    set((s) => ({ profile: { ...s.profile, labour: [{ ...l, id: (l as LabourCategory).id || "lab-" + uid() }, ...s.profile.labour] } })),

  updateLabour: (id, l) =>
    set((s) => ({
      profile: { ...s.profile, labour: s.profile.labour.map((x) => (x.id === id ? { ...x, ...l } : x)) },
    })),

  removeLabour: (id) =>
    set((s) => ({ profile: { ...s.profile, labour: s.profile.labour.filter((x) => x.id !== id) } })),
}));
