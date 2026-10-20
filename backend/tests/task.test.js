const { describe, it } = require("node:test");
const assert = require("node:assert");
const Task = require("../models/Task");

describe("Task Model Validation Tests", () => {
  it("should create a valid task instance with provided data", async () => {
    const taskData = {
      title: "Set up CI/CD pipeline",
      description: "Automate testing and deployment using GitHub Actions",
      completed: false,
      assignedUser: "Mayank Parmar"
    };

    const task = new Task(taskData);

    assert.strictEqual(task.title, taskData.title);
    assert.strictEqual(task.description, taskData.description);
    assert.strictEqual(task.completed, false);
    assert.strictEqual(task.assignedUser, "Mayank Parmar");

    // Validate schema
    await task.validate();
  });

  it("should require a title and reject validation when title is missing", async () => {
    const taskWithoutTitle = new Task({
      description: "A task without any title",
      assignedUser: "Mayank"
    });

    await assert.rejects(
      async () => {
        await taskWithoutTitle.validate();
      },
      (err) => {
        assert.ok(err.errors.title, "Validation should flag missing title");
        return true;
      }
    );
  });

  it("should apply default values when optional fields are omitted", async () => {
    const taskWithDefaults = new Task({
      title: "Submit Practical 12 Report"
    });

    assert.strictEqual(taskWithDefaults.completed, false, "completed must default to false");
    assert.strictEqual(taskWithDefaults.description, "", "description must default to empty string");
    assert.strictEqual(taskWithDefaults.assignedUser, "Unassigned", "assignedUser must default to Unassigned");

    await taskWithDefaults.validate();
  });

  it("should successfully validate when all required constraints are satisfied", async () => {
    const validTask = new Task({
      title: "Complete GitHub Actions Workflow"
    });

    // Should resolve cleanly with no error thrown
    await assert.doesNotReject(async () => {
      await validTask.validate();
    });
  });
});
