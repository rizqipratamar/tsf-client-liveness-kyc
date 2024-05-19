# TSF Client Liveness KYC

This demo explores using MediaPipe Facemesh for liveness verification during the KYC (Know Your Customer) process. It's designed to be implemented as a webview within a mobile application, ensuring a real person is present during registration without bloating the app's size.

## How it Works

- **Face Detection:** The app uses MediaPipe Facemesh to detect the user's face.
- **Liveness Instructions:** The user is guided through randomized actions like opening their mouth, blinking, and smiling.
- **Verification:** The app verifies if the actions are completed correctly, confirming a live person.
- **Real-Time Display:** A live video feed of the user with overlaid face landmarks is displayed.

## Why a Webview?

- **Minimizes App Size:** Integrating liveness detection directly into the app would significantly increase its size. A webview loads this functionality only when needed.
- **KYC Focused:** Liveness checks are usually required only during initial user registration (KYC), making a webview deployment more efficient.

## Getting Started

### Prerequisites

- **Node.js and npm (or yarn)**
- **Modern web browser with MediaPipe support (Chrome, Firefox)**

### Installation

1. Clone the repository: `git clone https://github.com/your-username/tsf-client-liveness-kyc.git`
2. Install dependencies: `cd tsf-client-liveness-kyc && npm install`

### Running the Demo

1. Start the development server: `npm run dev`
2. Open your web browser and visit: `http://localhost:3000`

## Using the Demo

1. Allow camera access to your browser.
2. The demo will begin detecting your face.
3. Follow the on-screen instructions (open your mouth, blink, smile).
4. The app will verify if you've completed the actions accurately.
5. A "Verification Successful!" message appears upon successful verification.

## Libraries Used

This project utilizes the following libraries:

- **MediaPipe:** For face landmark detection, camera utilities, and drawing utilities.
- **Next.js:** A React framework for building the web application.
- **React:** A JavaScript library for building user interfaces.
- **Tailwind CSS:** A utility-first CSS framework for styling.
- **DaisyUI:** A component library built on top of Tailwind CSS.

## Customization

- Liveness instructions are customizable in the `pages/index.js` file.
- Adjust threshold parameters for blink, mouth open, and smile detection within the same file.

## Important Notes

- This demo is for demonstration purposes and may not offer highly accurate liveness verification.
- Accuracy is affected by lighting conditions and camera quality.
- Experiment with thresholds and add more liveness actions to improve accuracy.

## License

This project is licensed under the MIT License.
