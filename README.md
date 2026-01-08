# 🚕 Maxim Backend System (Ride Hailing App)

Backend infrastructure for the Maxim Ride Hailing Application developed for **BERR2423**. This system manages Users (Customers/Drivers), Bookings, Vehicles, and Administrative Analytics using a robust RESTful API architecture.

---

## 🚀 Live Server

Use the links below to access the deployed cloud application:

* **🌐 API Base URL (Server):**
    [https://benr2423-alief-bvhsfxf8axgsadbt.eastasia-01.azurewebsites.net](https://benr2423-alief-bvhsfxf8axgsadbt.eastasia-01.azurewebsites.net)

* **📊 Admin Dashboard (Visual Interface):**
    [https://benr2423-alief-bvhsfxf8axgsadbt.eastasia-01.azurewebsites.net/dashboard/admin](https://benr2423-alief-bvhsfxf8axgsadbt.eastasia-01.azurewebsites.net/dashboard/admin)

* **🔐 Login & Register UI:**
    [https://benr2423-alief-bvhsfxf8axgsadbt.eastasia-01.azurewebsites.net/dashboard/login](https://benr2423-alief-bvhsfxf8axgsadbt.eastasia-01.azurewebsites.net/dashboard/login)

---

## 🛠️ Tech Stack

* **Runtime:** Node.js (JavaScript)
* **Framework:** Express.js
* **Database:** MongoDB Atlas (Cloud Cluster)
* **Deployment:** Microsoft Azure App Service (via External Git)
* **Testing:** Postman
* **Security:** BCrypt (Hashing) & JWT (Authentication)

---

## 📂 Key Features

### **1. Authentication & Security**
* Secure User Registration & Login (Customer/Driver/Admin).
* Password Hashing using `bcrypt`.
* Token-based Authentication using **JSON Web Tokens (JWT)**.

### **2. Ride Management**
* **Customers:** Can book rides, view status, cancel bookings, and rate drivers.
* **Drivers:** Can view available jobs, accept rides, and update ride status (e.g., "Picked Up", "Completed").

### **3. Admin Analytics**
* **Visual Dashboard:** Real-time charts showing Total Revenue, User Counts, and Ride Status.
* **System Controls:** Ability to block/unblock users.

---

## 📄 Project Documentation

All project documentation and diagrams are organized in the **MaximDB Successful** folder within this repository:

* **ERD & Class Diagrams:** Database structure design.
* **Postman Collection:** Importable file for API testing.
* **User Manual:** Instructions on how to use the system.