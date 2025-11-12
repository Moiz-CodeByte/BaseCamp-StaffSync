"use client";

import HRProfileTab from '../hr/HRProfileTab';

export default function AdminProfileTab({ me, profileForm, setProfileForm, updateProfile }) {
  return (
    <HRProfileTab 
      me={me} 
      profileForm={profileForm} 
      setProfileForm={setProfileForm} 
      updateProfile={updateProfile}
    />
  );
}
