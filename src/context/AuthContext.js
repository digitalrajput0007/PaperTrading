import React, { useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    sendEmailVerification,
    onAuthStateChanged 
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import toast from 'react-hot-toast';

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null); // State to hold Firestore user data
    const [loading, setLoading] = useState(true);

    // This function now accepts all the necessary fields
    async function signup(email, password, firstName, lastName, mobile, gender) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);

            // Now saves all fields to the user's document
            await setDoc(doc(db, "users", userCredential.user.uid), {
                uid: userCredential.user.uid,
                email: email,
                firstName: firstName,
                lastName: lastName,
                mobile: mobile,
                gender: gender,
                createdAt: new Date(),
                photoURL: '' // Initialize photoURL
            });
            
            toast.success('Verification email sent! Please check your inbox.');
            return userCredential;
        } catch (error) {
            toast.error(error.message || "Failed to create an account.");
            console.error("Signup error:", error);
        }
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        setUserData(null); // Clear user data on logout
        return signOut(auth);
    }

    // New function to update user details in Firestore
    async function updateUserDetails(uid, data) {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, data);
        setUserData(prev => ({...prev, ...data})); // Also update local state immediately
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                // If user is logged in, fetch their data from Firestore
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
        userData, // Provide userData to all components
        signup,
        login,
        logout,
        updateUserDetails // Provide the update function
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
