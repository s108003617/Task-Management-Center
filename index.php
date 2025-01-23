<?php
header('Content-Type: application/json');
session_start();

class TaskManager {
    private $tasksFile = 'tasks.json';

    public function loadTasks() {
        if (!file_exists($this->tasksFile)) {
            file_put_contents($this->tasksFile, json_encode([]));
        }
        return json_decode(file_get_contents($this->tasksFile), true) ?: [];
    }

    public function saveTasks($tasks) {
        file_put_contents($this->tasksFile, json_encode($tasks, JSON_PRETTY_PRINT));
    }

    public function addTask($task) {
        $tasks = $this->loadTasks();
        $tasks[] = $task;
        $this->saveTasks($tasks);
        return ['status' => 'success'];
    }

    public function updateTask($updatedTask) {
        $tasks = $this->loadTasks();
        $tasks = array_map(function($task) use ($updatedTask) {
            return $task['id'] === $updatedTask['id'] ? $updatedTask : $task;
        }, $tasks);
        $this->saveTasks($tasks);
        return ['status' => 'success'];
    }

    public function deleteTask($taskId) {
        $tasks = $this->loadTasks();
        $tasks = array_filter($tasks, function($task) use ($taskId) {
            return $task['id'] !== $taskId;
        });
        $this->saveTasks($tasks);
        return ['status' => 'success'];
    }
}

$taskManager = new TaskManager();
$action = $_SERVER['REQUEST_METHOD'];

if ($action === 'GET') {
    echo json_encode($taskManager->loadTasks());
    exit;
}

// 如果是 AJAX 請求，則處理 POST/DELETE
if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') {
    $data = json_decode(file_get_contents('php://input'), true);
    switch ($action) {
        case 'POST':
            if (isset($data['action'])) {
                switch ($data['action']) {
                    case 'add':
                        echo json_encode($taskManager->addTask($data['task']));
                        break;
                    case 'update':
                        echo json_encode($taskManager->updateTask($data['task']));
                        break;
                }
            }
            break;
        case 'DELETE':
            $taskId = $_GET['id'] ?? null;
            echo json_encode($taskManager->deleteTask($taskId));
            break;
    }
    exit;
}
?>