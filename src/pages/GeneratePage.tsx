@@ .. @@
 import React, { useState } from 'react';
 import { Sparkles, Download, Save, Loader2 } from 'lucide-react';
 import { useAuthStore } from '../store/authStore';
 import { supabase } from '../lib/supabase';
+import { CreditDisplay } from '../components/CreditDisplay';
 import html2canvas from 'html2canvas';
 
@@ .. @@
   return (
     <div className="min-h-screen bg-gray-50 py-8">
       <div className="max-w-6xl mx-auto px-4">
-        <div className="mb-8 text-center">
+        <div className="mb-6 text-center">
           <h1 className="text-3xl font-bold text-gray-900 mb-4">Generate Your Logo</h1>
           <p className="text-gray-600 max-w-2xl mx-auto">
             Describe your business and let our AI create professional logos for you.
           </p>
         </div>
+
+        <div className="flex justify-center mb-8">
+          <CreditDisplay />
+        </div>
 
         <div className="grid lg:grid-cols-2 gap-8">
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
             <h2 className="text-xl font-semibold text-gray-900 mb-6">Logo Generator</h2>
             
             <form onSubmit={handleSubmit} className="space-y-6">
               <div>
                 <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                   Company Name *
                 </label>
                 <input
                   type="text"
                   id="companyName"
                   value={formData.companyName}
                   onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                   placeholder="Enter your company name"
                   required
                 />
               </div>
   )