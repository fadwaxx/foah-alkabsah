const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const bcrypt = require("bcryptjs");

require("dotenv").config();
const MenuItem = require("./models/MenuItem");
const Order = require("./models/Order");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    }
  });
  
  const upload = multer({ storage: storage });

  const Customer = require("./models/Customer");
  app.post("/api/menu", upload.single("image"), async (req, res) => {
    try {
      const imagePath = req.file
        ? `/uploads/${req.file.filename}`
        : "";
  
      let options = [];
  
      try {
        options = req.body.options
          ? JSON.parse(req.body.options)
          : [];
      } catch {
        return res.status(400).json({
          message: "صيغة الخيارات غير صحيحة"
        });
      }
  
      const item = await MenuItem.create({
        ar: req.body.ar,
        en: req.body.en,
        price: Number(req.body.price),
        category: req.body.category,
        image: imagePath,
        description: req.body.description,
        isNew: req.body.isNew === "true",
        calories: Number(req.body.calories) || 0,
        options
      });
  
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });app.put("/api/menu/:id", upload.single("image"), async (req, res) => {
    try {
      let options = [];
  
      try {
        options = req.body.options
          ? JSON.parse(req.body.options)
          : [];
      } catch {
        return res.status(400).json({
          message: "صيغة الخيارات غير صحيحة"
        });
      }
  
      const updateData = {
        ar: req.body.ar,
        en: req.body.en,
        price: Number(req.body.price),
        category: req.body.category,
        description: req.body.description,
        isNew: req.body.isNew === "true",
        calories: Number(req.body.calories) || 0,
        options
      };
  
      if (req.file) {
        updateData.image = `/uploads/${req.file.filename}`;
      }
  
      const item = await MenuItem.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );
  
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app.delete("/api/menu/:id", async (req, res) => {
    try {
      await MenuItem.findByIdAndDelete(req.params.id);
      res.json({ message: "تم حذف الصنف" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/menu", async (req, res) => {

    try {
  
      const items = await MenuItem.find();
  
      res.json(items);
  
    } catch (error) {
  
      res.status(500).json({
        message: error.message
      });
  
    }
  
  });
  app.post("/api/orders", async (req, res) => {
    console.log("وصل طلب جديد:");
    console.log(req.body);
    try {
  
      const order = await Order.create(req.body);
  
      res.status(201).json(order);
  
    } catch (error) {
  
      res.status(500).json({
        message: error.message
      });
  
    }
  
  });
  app.get("/api/orders", async (req, res) => {
    
    try {
  
      const orders = await Order.find()
        .sort({ createdAt: -1 });
  
      res.json(orders);
  
    } catch (error) {
  
      res.status(500).json({
        message: error.message
      });
  
    }
  
  });

  app.get("/seed-menu", async (req, res) => {

    await MenuItem.create({
      ar: "دجاج مظبي",
      en: "Madhbi Chicken",
      price: 28,
      category: "chicken",
      image: "",
      description: "دجاج مشوي على الحطب مع أرز بسمتي"
    });
  
    res.send("تمت إضافة الصنف");
  });
  app.post("/api/customers/register", async (req, res) => {
    try {
      const { name, phone, email, password } = req.body;
  
      if (!name || !phone || !password) {
        return res.status(400).json({
          message: "الاسم والجوال وكلمة المرور مطلوبة"
        });
      }
  
      if (password.length < 6) {
        return res.status(400).json({
          message: "كلمة المرور يجب أن تكون 6 أحرف أو أكثر"
        });
      }
  
      const cleanPhone = phone.trim();
      const cleanEmail = email && email.trim() !== ""
        ? email.trim().toLowerCase()
        : undefined;
  
      const conditions = [{ phone: cleanPhone }];
  
      if (cleanEmail) {
        conditions.push({ email: cleanEmail });
      }
  
      const existing = await Customer.findOne({
        $or: conditions
      });
  
      if (existing) {
        if (existing.phone === cleanPhone) {
          return res.status(400).json({
            message: "رقم الجوال مستخدم مسبقاً"
          });
        }
  
        if (cleanEmail && existing.email === cleanEmail) {
          return res.status(400).json({
            message: "البريد الإلكتروني مستخدم مسبقاً"
          });
        }
  
        return res.status(400).json({
          message: "الحساب موجود مسبقاً"
        });
      }
  
      const passwordHash = await bcrypt.hash(password, 10);
  
      const customer = await Customer.create({
        name,
        phone: cleanPhone,
        email: cleanEmail,
        passwordHash
      });
  
      res.status(201).json({
        message: "تم إنشاء الحساب",
        customer: {
          _id: customer._id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email
        }
      });
  
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  });
    app.post("/api/customers/login", async (req, res) => {
    try {
      const { identifier, password } = req.body;
  
      if (!identifier || !password) {
        return res.status(400).json({
          message: "أدخلي الجوال/الإيميل وكلمة المرور"
        });
      }
  
      const cleanIdentifier = identifier.trim().toLowerCase();
  
      const customer = await Customer.findOne({
        $or: [
          { phone: identifier.trim() },
          { email: cleanIdentifier }
        ]
      });
  
      if (!customer) {
        return res.status(400).json({
          message: "الحساب غير موجود"
        });
      }
  
      const isMatch = await bcrypt.compare(password, customer.passwordHash);
  
      if (!isMatch) {
        return res.status(400).json({
          message: "كلمة المرور غير صحيحة"
        });
      }
  
      res.json({
        message: "تم تسجيل الدخول",
        customer: {
          _id: customer._id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email
        }
      });
  
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  });
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await Customer.find()
        .select("-passwordHash")
        .sort({ createdAt: -1 });
  
      res.json(customers);
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  });
  app.get("/api/customers/:id/orders", async (req, res) => {
    try {
      const orders = await Order.find({ customerId: req.params.id })
        .sort({ createdAt: -1 });
  
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app.put("/api/customers/:id", async (req, res) => {
    try {
      const { name, phone, email } = req.body;
  
      const customer = await Customer.findByIdAndUpdate(
        req.params.id,
        { name, phone, email },
        { new: true }
      ).select("-passwordHash");
  
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app.put("/api/customers/:id/location", async (req, res) => {
    try {
      const { lat, lng, address } = req.body;
  
      const customer = await Customer.findByIdAndUpdate(
        req.params.id,
        {
          location: {
            lat,
            lng,
            address
          }
        },
        { new: true }
      ).select("-passwordHash");
  
      res.json(customer);
  
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  });



mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("✅ MongoDB Connected");
})
.catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
});

app.get("/", (req, res) => {
    res.sendFile(
      path.join(__dirname, "frontend", "foah-alkabsah (1).html")
    );
  });
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
