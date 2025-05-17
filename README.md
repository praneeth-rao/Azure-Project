# Azure File Manager (Cloud-Based File Management System)

This is a cloud-based file manager that allows users to securely upload, download, and delete their files. It uses **Azure services** for backend and storage, and **Firebase Authentication** for user login.

## Features

- Google Sign-In with Firebase Authentication
- Upload, list, download, and delete files
- Files stored in Azure Blob Storage
- Metadata stored in Azure Table Storage
- Serverless backend with Azure Function App
- Frontend hosted on Azure Static Web Apps
- Clean Bootstrap-styled interface

## Technologies Used

- Azure Blob Storage
- Azure Table Storage
- Azure Function App
- Azure Static Web Apps
- Firebase Authentication
- JavaScript (Vanilla)
- Bootstrap (for UI)

## Project Structure

```
Azure Project/ # project-root
│
├── frontend/ # Frontend code (hosted on Azure Static Web Apps)
│ └── index.html
│
├── backend/ # Azure Function App (serverless API)
│ ├── uploadFile/
│ ├── downloadFile/
│ ├── deleteFile/
│ ├── listFiles/
│ └── registerUser/
│
└── README.md # This file
```
