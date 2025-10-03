# Root dependencies (concurrently)
npm install

# Backend
cd backend
npm install
npm run dev  # runs nodemon server.js on port 5000

# Frontend (in a second terminal)
cd "..\frontend"
npm install
npm start    # runs React dev server on port 3000
