@@ .. @@
 import React from 'react';
-import { Link } from 'react-router-dom';
+import { Link, useLocation } from 'react-router-dom';
 import { Palette, User, Settings, LogOut, Menu, X, Sparkles } from 'lucide-react';
 import { useAuthStore } from '../store/authStore';
+import { CreditDisplay } from './CreditDisplay';
 
@@ .. @@
 export const Navigation: React.FC = () => {
   const { user, signOut } = useAuthStore();
+  const location = useLocation();
   const [isMenuOpen, setIsMenuOpen] = React.useState(false);
 
@@ .. @@
         <div className="flex items-center justify-between">
           <Link to="/" className="flex items-center space-x-2">
             <Palette className="w-8 h-8 text-indigo-600" />
             <span className="text-xl font-bold text-gray-900">LogoNova</span>
           </Link>
 
           {user ? (
-            <div className="hidden md:flex items-center space-x-6">
+            <div className="hidden md:flex items-center space-x-4">
+              <CreditDisplay />
               <Link
                 to="/generate"
-                className="text-gray-700 hover:text-indigo-600 font-medium"
+                className={`text-gray-700 hover:text-indigo-600 font-medium ${
+                  location.pathname === '/generate' ? 'text-indigo-600' : ''
+                }`}
               >
                 Generate
               </Link>
               <Link
                 to="/dashboard"
-                className="text-gray-700 hover:text-indigo-600 font-medium"
+                className={`text-gray-700 hover:text-indigo-600 font-medium ${
+                  location.pathname === '/dashboard' ? 'text-indigo-600' : ''
+                }`}
               >
                 Dashboard
               </Link>
+              <Link
+                to="/pricing"
+                className={`text-gray-700 hover:text-indigo-600 font-medium ${
+                  location.pathname === '/pricing' ? 'text-indigo-600' : ''
+                }`}
+              >
+                Pricing
+              </Link>
               <div className="relative">
                 <button
                   onClick={() => setIsMenuOpen(!isMenuOpen)}
                   className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600"
                 >
                   <User className="w-5 h-5" />
                   <span className="font-medium">{user.email}</span>
                 </button>
 
                 {isMenuOpen && (
                   <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-md border border-gray-200 py-1 z-50">
                     <Link
                       to="/settings"
                       className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                       onClick={() => setIsMenuOpen(false)}
                     >
                       <Settings className="w-4 h-4 mr-2" />
                       Settings
                     </Link>
                     <button
                       onClick={() => {
                         signOut();
                         setIsMenuOpen(false);
                       }}
                       className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                     >
                       <LogOut className="w-4 h-4 mr-2" />
                       Sign Out
                     </button>
                   </div>
                 )}
               </div>
             </div>
           ) : (
@@ .. @@
             {user && (
               <>
                 <div className="px-2 pt-2 pb-3 space-y-1">
+                  <div className="px-3 py-2">
+                    <CreditDisplay />
+                  </div>
                   <Link
                     to="/generate"
-                    className="block px-3 py-2 text-gray-700 hover:text-indigo-600 font-medium"
+                    className={`block px-3 py-2 text-gray-700 hover:text-indigo-600 font-medium ${
+                      location.pathname === '/generate' ? 'text-indigo-600' : ''
+                    }`}
                     onClick={() => setIsMenuOpen(false)}
                   >
                     Generate
                   </Link>
                   <Link
                     to="/dashboard"
-                    className="block px-3 py-2 text-gray-700 hover:text-indigo-600 font-medium"
+                    className={`block px-3 py-2 text-gray-700 hover:text-indigo-600 font-medium ${
+                      location.pathname === '/dashboard' ? 'text-indigo-600' : ''
+                    }`}
                     onClick={() => setIsMenuOpen(false)}
                   >
                     Dashboard
                   </Link>
+                  <Link
+                    to="/pricing"
+                    className={`block px-3 py-2 text-gray-700 hover:text-indigo-600 font-medium ${
+                      location.pathname === '/pricing' ? 'text-indigo-600' : ''
+                    }`}
+                    onClick={() => setIsMenuOpen(false)}
+                  >
+                    Pricing
+                  </Link>
                   <Link
                     to="/settings"
-                    className="block px-3 py-2 text-gray-700 hover:text-indigo-600 font-medium"
+                    className={`block px-3 py-2 text-gray-700 hover:text-indigo-600 font-medium ${
+                      location.pathname === '/settings' ? 'text-indigo-600' : ''
+                    }`}
                     onClick={() => setIsMenuOpen(false)}
                   >
                     Settings
                   </Link>
                   <button
                     onClick={() => {
                       signOut();
                       setIsMenuOpen(false);
                     }}
                     className="block w-full text-left px-3 py-2 text-gray-700 hover:text-indigo-600 font-medium"
                   >
                     Sign Out
                   </button>
                 </div>
               </>
             )}
           </div>
         )}
       </div>