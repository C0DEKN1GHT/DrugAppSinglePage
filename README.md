Installation Walkthrough ---------------------------------
1:Root dependencies (concurrently)
npm install

2:Backend
cd backend
npm install
npm run dev  # runs nodemon server.js on port 5000

3:Frontend (in a second terminal)
cd "..\frontend"
npm install
npm start    # runs React dev server on port 3000

The frontend proxy is set to http://localhost:5000, so API calls go to your backend automatically.
