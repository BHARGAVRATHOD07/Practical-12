import { useEffect, useState } from "react";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../api";

function Projects() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedUser, setAssignedUser] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Fetch all tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load tasks when Projects page starts
  useEffect(() => {
    fetchTasks();
  }, []);

  // Create task
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Task title is required");
      return;
    }

    try {
      setError("");
      setMessage("");

      await createTask({
        title,
        description,
        assignedUser: assignedUser.trim() || "Unassigned",
        completed: false,
      });

      setTitle("");
      setDescription("");
      setAssignedUser("");

      setMessage("Task created successfully!");

      fetchTasks();
    } catch (error) {
      setError(error.message);
    }
  };

  // Toggle task completed
  const handleToggle = async (task) => {
    try {
      setError("");
      setMessage("");

      await updateTask(task._id, {
        ...task,
        completed: !task.completed,
      });

      setMessage("Task updated successfully!");

      fetchTasks();
    } catch (error) {
      setError(error.message);
    }
  };

  // Delete task
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmDelete) return;

    try {
      setError("");
      setMessage("");

      await deleteTask(id);

      setMessage("Task deleted successfully!");

      fetchTasks();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="container">
      <h1>Task Manager</h1>

      <p className="subtitle">
        React + Node.js + MongoDB Full Stack Application
      </p>

      <form onSubmit={handleSubmit} className="task-form">
        <input
          type="text"
          placeholder="Enter task title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <input
          type="text"
          placeholder="Assigned user (e.g. Ohm, Mayank, Admin)"
          value={assignedUser}
          onChange={(event) => setAssignedUser(event.target.value)}
        />

        <textarea
          placeholder="Enter task description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

        <button type="submit">Add Task</button>
      </form>

      {error && <p className="error">{error}</p>}

      {message && <p className="message">{message}</p>}

      <h2>My Tasks</h2>

      {loading ? (
        <p>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks found. Create your first task!</p>
      ) : (
        <div className="task-list">
          {tasks.map((task) => (
            <div
              key={task._id}
              className={`task ${task.completed ? "completed" : ""}`}
            >
              <div>
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                {task.assignedUser && (
                  <p className="task-assigned">👤 Assigned to: {task.assignedUser}</p>
                )}
              </div>

              <div className="buttons">
                <button
                  className="complete-btn"
                  onClick={() => handleToggle(task)}
                >
                  {task.completed ? "Undo" : "Complete"}
                </button>

                <button
                  className="delete-btn"
                  onClick={() => handleDelete(task._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Projects;