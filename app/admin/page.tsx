@@ .. @@
       <div className="flex items-center justify-between">
-        <h1 className="text-3xl font-bold">Lost and Found@MU - Admin Dashboard</h1>
+        <h1 className="text-3xl font-bold">Loki Admin - Lost & Found</h1>
         <Button onClick={fetchData} variant="outline">
           Refresh Data
         </Button>
@@ .. @@
+      {/* Navigation */}
+      <Card>
+        <CardContent className="p-4">
+          <div className="flex gap-4">
+            <Button onClick={() => window.location.href = '/admin/dashboard'} variant="outline">
+              📊 Main Dashboard
+            </Button>
+            <Button onClick={() => window.location.href = '/admin/events'} variant="outline">
+              🎉 Events
+            </Button>
+            <Button onClick={() => window.location.href = '/admin/faqs'} variant="outline">
+              ❓ FAQs
+            </Button>
+          </div>
+        </CardContent>
+      </Card>
+
       {/* Stats Cards */}