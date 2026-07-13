import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function LoginPrompt() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card rounded-3xl p-12 max-w-md w-full text-center"
            >
                <span className="text-4xl mb-6 block">🔒</span>
                <h2 className="heading-sm mb-3">Accès Restreint</h2>
                <p className="body-sm mb-8">
                    Connectez-vous pour accéder à cette page.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => navigate('/login')}
                        className="btn-primary flex-1"
                    >
                        Se connecter
                        <span className="ml-1">→</span>
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="btn-outline flex-1"
                    >
                        Retour
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default LoginPrompt;