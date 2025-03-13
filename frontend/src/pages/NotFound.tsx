import { Helmet } from 'react-helmet-async';
import { useNavigate } from "react-router-dom";

const NotFound = () => {
    const navigate = useNavigate();
    return (
        <>
            <Helmet>
              <title>404 - Page Not Found</title>
          </Helmet>
            <div className="error-page d-flex align-items-center justify-content-center">
                <div className="error-container text-center p-4">
                    <h1 className="error-code text-tertiary mb-0">404</h1>
                    <h2 className="display-6 text-tertiary mb-3">Page Not Found</h2>
                    <p className="lead error-message mb-5">We can't seem to find the page you're looking for.</p>
                    <div className="d-flex justify-content-center gap-3">
                        <button onClick={() => navigate("/")} className="btn btn-tertiary rounded-0 px-4 py-2">Return Home</button>
                        <button onClick={() => navigate("/")} className="btn btn-tertiary rounded-0 py-2">Report Problem</button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default NotFound;
