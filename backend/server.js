
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const NodeCache = require("node-cache");
const EventEmitter = require("events");

const taskEvents = new EventEmitter();

const app = express();

// Cache configuration: expire entries after 60 seconds
const taskCache = new NodeCache({
    stdTTL: 60,
    checkperiod: 120
});

// Cache statistics
let cacheHits = 0;
let cacheMisses = 0;

app.use(cors());
app.use(express.json());

// Import Task Model
const Task = require("./models/Task");
taskEvents.on("task-created", (taskData) => {
    setTimeout(() => {
        console.log("\n===== TASK NOTIFICATION =====");
        console.log("Task Title:", taskData?.title || "Unknown task");
        console.log("Assigned User:", taskData?.assignedUser || "Unassigned");
        console.log("Timestamp:", new Date().toISOString());
        console.log("=============================\n");
    }, 1000);
});


// MongoDB Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully");
    })
    .catch((error) => {
        console.log("MongoDB Connection Error:", error.message);
    });

// Test Route
app.get("/", (req, res) => {
    res.send("Task Manager Backend is Running!");
});

// GET all tasks with caching
app.get("/tasks", async (req, res) => {
    try {
        const cachedTasks = taskCache.get("allTasks");
        

        if (cachedTasks !== undefined) {
            res.set("X-Cache", "HIT");
            return res.status(200).json(cachedTasks);
        }

        const tasks = await Task.find().lean();

        taskCache.set("allTasks", tasks);

        res.set("X-Cache", "MISS");
        return res.status(200).json(tasks);
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
});
// GET a single task with separate caching
app.get("/tasks/:id", async (req, res) => {
    try {
        const cacheKey = `task_${req.params.id}`;
        const cachedTask = taskCache.get(cacheKey);

        if (cachedTask !== undefined) {
            cacheHits++;

            res.set("X-Cache", "HIT");
            return res.status(200).json(cachedTask);
        }

        cacheMisses++;

        const task = await Task.findById(req.params.id).lean();

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        taskCache.set(cacheKey, task);

        res.set("X-Cache", "MISS");
        return res.status(200).json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// CREATE a new task
app.post("/tasks", async (req, res) => {
    try {
        const task = new Task({
            title: req.body.title,
            description: req.body.description,
            completed: req.body.completed,
            assignedUser: req.body.assignedUser || "Unassigned"
        });

        const savedTask = await task.save();

        // Clear cached task list
        taskCache.del("allTasks");

        // Respond to the client
        res.status(201).json({
            message: "Task created successfully",
            task: savedTask
        });

        console.log("API response sent at:", new Date().toISOString());

        // Emit the event asynchronously
        setImmediate(() => {
            taskEvents.emit("task-created", {
                title: savedTask.title,
                assignedUser: req.body.assignedUser || "Unassigned"
            });
        });

    } catch (error) {
        console.error("Task creation error:", error.message);

        if (!res.headersSent) {
            res.status(400).json({ message: error.message });
        }
    }
});

// UPDATE a task
app.put("/tasks/:id", async (req, res) => {
    try {
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedTask) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        // Invalidate both list and individual task caches
        taskCache.del("allTasks");
        taskCache.del(`task_${req.params.id}`);

        res.status(200).json(updatedTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE a task
app.delete("/tasks/:id", async (req, res) => {
    try {
        const deletedTask = await Task.findByIdAndDelete(
            req.params.id
        );

        if (!deletedTask) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        // Invalidate both list and individual task caches
        taskCache.del("allTasks");
        taskCache.del(`task_${req.params.id}`);

        res.status(200).json({
            message: "Task deleted successfully"
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DEBUG: Cache statistics
app.get("/debug/cache", (req, res) => {
    const totalRequests = cacheHits + cacheMisses;

    res.json({
        cacheHits,
        cacheMisses,
        totalRequests,
        hitRate: totalRequests === 0
            ? "0%"
            : (
                (cacheHits / totalRequests) * 100
            ).toFixed(2) + "%",
        cachedKeys: taskCache.keys()
    });
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
