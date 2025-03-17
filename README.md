# SEARCHSCAPE--Image Fetch and Transform with Unsplash and Hugging Face

This project combines **Unsplash** and **Hugging Face** to create a powerful image-based application. It uses an **MCP (Model Context Protocol) server** to fetch high-quality images from Unsplash and apply AI-powered transformations using Hugging Face models.

---

## Features

1. **Fetch Images**:
   - Fetch beautiful, high-resolution images from Unsplash using natural language prompts.
   
2. **Transform Images**:
   - Apply AI-powered transformations to the fetched images using Hugging Face models:
     - **Artistic Style Transfer**: Apply artistic styles to images.
     - **Image Enhancement**: Enhance image quality using super-resolution.
     - **Image-to-Image Translation**: Transform images based on text prompts (e.g., "make it look like a cartoon").

---

## How It Works

The project is built around an **MCP server** that handles requests and responses. The server provides two main tools:

### 1. Fetch Image Tool
- **Name**: `fetch-image`
- **Description**: Fetches an image from Unsplash based on a user's text prompt.
- **Input**:
  - `prompt`: A text description of the desired image (e.g., "sunset over mountains").
  - `userId`: A unique identifier for the user session.
- **Output**:
  - Returns the URL of the fetched image.

### 2. Transform Image Tool
- **Name**: `transform-image`
- **Description**: Applies a transformation to the fetched image using Hugging Face models.
- **Input**:
  - `filter`: The type of transformation to apply (`artistic`, `enhance`, or `translate`).
  - `userId`: A unique identifier for the user session.
- **Output**:
  - Returns the URL of the transformed image.

---

## MCP Server Details

The MCP server is the backbone of this project. It:
- Manages user sessions and stores fetched image URLs.
- Handles requests for fetching and transforming images.
- Integrates with Unsplash and Hugging Face APIs.

### Tools Provided by the MCP Server

1. **`fetch-image`**:
   - Fetches images from Unsplash.
   - Stores the image URL in a session-specific map (`userImageStore`).

2. **`transform-image`**:
   - Uses Hugging Face models to apply transformations to the fetched image.
   - Returns the transformed image URL.

---

## Models Used

The following Hugging Face models are used for image transformations:

1. **Artistic Style Transfer**:
   - **Model**: `lambdalabs/sd-style-transfer`
   - **Description**: Applies artistic styles to images.

2. **Image Enhancement**:
   - **Model**: `eugenesiow/super-image`
   - **Description**: Enhances image quality using super-resolution.

3. **Image-to-Image Translation**:
   - **Model**: `timbrooks/instruct-pix2pix`
   - **Description**: Transforms images based on text prompts (e.g., "make it look like a cartoon").

---

## Setup and Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
