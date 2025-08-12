import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { applyActionCode, checkActionCode } from 'firebase/auth';
import { auth } from '../firebase';

const ActionHandlerPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const actionCode = searchParams.get('oobCode');

    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('Verifying your request...');
    const actionHandled = useRef(false);

    useEffect(() => {
        if (actionHandled.current || !actionCode) {
            if (!actionCode) {
                setStatus('error');
                setMessage('Invalid link. Required parameters are missing.');
            }
            return;
        }
        actionHandled.current = true;

        const handleAction = async () => {
            try {
                // Use checkActionCode to reliably determine the operation
                const actionCodeInfo = await checkActionCode(auth, actionCode);

                switch (actionCodeInfo.operation) {
                    case 'VERIFY_EMAIL':
                        await applyActionCode(auth, actionCode);
                        setStatus('success');
                        setMessage('Your email has been verified successfully!');
                        break;
                    case 'PASSWORD_RESET':
                        // This is a password reset link, so redirect to the correct page.
                        navigate(`/reset-password?oobCode=${actionCode}`);
                        break;
                    default:
                        // This handles any other case.
                        setStatus('error');
                        setMessage('Invalid action link for this page.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('This link is invalid, has expired, or has already been used. Please try again.');
                console.error("Action handler error:", err);
            }
        };

        handleAction();
    }, [actionCode, navigate]);

    const renderContent = () => {
        // This component will now mostly show loading/error messages,
        // as successful actions will redirect the user.
        switch (status) {
            case 'loading':
                return <p className="text-text-primary">{message}</p>;
            case 'success':
                return (
                    <>
                        <h2 className="text-2xl font-bold text-green-400 mb-4">Success!</h2>
                        <p className="text-text-primary mb-6">{message}</p>
                        <Link to="/login" className="w-full bg-secondary hover:bg-secondary-dark text-white font-bold py-3 rounded-lg transition duration-300 inline-block text-center">
                            Proceed to Login
                        </Link>
                    </>
                );
            case 'error':
                return (
                    <>
                        <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
                        <p className="text-text-primary">{message}</p>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-primary flex items-center justify-center p-4">
            <div className="bg-primary-light p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-700 text-center">
                {renderContent()}
            </div>
        </div>
    );
};

export default ActionHandlerPage;
