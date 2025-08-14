import React, { useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    sendEmailVerification,
    sendPasswordResetEmail,
    onAuthStateChanged,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import toast from 'react-hot-toast';

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSigningUp, setIsSigningUp] = useState(false); // <-- Add state to prevent double submission

    async function signup(email, password, firstName, lastName, mobile, gender) {
        // If a signup process is already running, do nothing.
        if (isSigningUp) return;

        setIsSigningUp(true); // <-- Set signing up state to true
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const actionCodeSettings = {
                url: `${window.location.origin}/action`, // This URL points to your ActionHandlerPage
                handleCodeInApp: true,
            };
            await sendEmailVerification(userCredential.user, actionCodeSettings);

            await setDoc(doc(db, "users", userCredential.user.uid), {
                uid: userCredential.user.uid,
                email: email,
                firstName: firstName,
                lastName: lastName,
                mobile: mobile,
                gender: gender,
                createdAt: new Date(),
                photoURL: ''
            });
            
            toast.success('Verification email sent! Please check your inbox.');
            return userCredential;
        } catch (error) {
            // Check for the specific duplicate email error code
            if (error.code === 'auth/email-already-in-use') {
                toast.error("An account already exists with this email address.");
            } else {
                // Handle other potential errors generically
                toast.error(error.message || "Failed to create an account.");
            }
            console.error("Signup error:", error);
        } finally {
            setIsSigningUp(false); // <-- Reset signing up state regardless of outcome
        }
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        setUserData(null);
        return signOut(auth);
    }

    // --- NEW: Function for Forgot Password ---
    function sendPasswordReset(email) {
        const actionCodeSettings = {
            url: `${window.location.origin}/action`, // Also points to your ActionHandlerPage
            handleCodeInApp: true,
        };
        return sendPasswordResetEmail(auth, email, actionCodeSettings);
    }

    async function updateUserDetails(uid, data) {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, data);
        setUserData(prev => ({...prev, ...data}));
    }

    // --- FUNCTIONS FOR IN-APP PASSWORD CHANGE ---
    // Sensitive operations like this require recent login.
    // You must call this reauthenticate function before updateUserPassword.
    function reauthenticate(currentPassword) {
        const user = auth.currentUser;
        const cred = EmailAuthProvider.credential(user.email, currentPassword);
        return reauthenticateWithCredential(user, cred);
    }

    function updateUserPassword(newPassword) {
        const user = auth.currentUser;
        return updatePassword(user, newPassword);
    }
    // ------------------------------------

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                } else {
                    console.log("No such user document!");
                }
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userData,
        isSigningUp, // <-- Export the new state
        signup,
        login,
        logout,
        sendPasswordReset,
        updateUserDetails,
        reauthenticate,
        updateUserPassword
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
