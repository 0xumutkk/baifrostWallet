import { useState } from 'react';
import { WdkProvider, useWdk } from './contexts/WdkContext';
import { PinProvider, usePin } from './contexts/PinContext';
import { AgentProvider } from './contexts/AgentContext';
import { PinSetup } from './components/PinSetup';
import { UnlockScreen } from './components/UnlockScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SeedPhraseBackup } from './components/SeedPhraseBackup';
import { SeedPhraseConfirmation } from './components/SeedPhraseConfirmation';
import { ImportWalletScreen } from './components/ImportWalletScreen';
import { Dashboard } from './components/Dashboard';
import { SendScreen } from './components/SendScreen';
import { SwapScreen } from './components/SwapScreen';
import { ReceiveScreen } from './components/ReceiveScreen';
import { AgentChatWidget } from './components/AgentChatWidget';
import { TransactionApproval } from './components/TransactionApproval';
import { AnimatePresence } from 'framer-motion';
import { secureStorage } from './utils/secureStorage';
import './index.css';

type Screen = 'dashboard' | 'send' | 'swap' | 'receive';
type OnboardingStep = 'welcome' | 'pin-setup' | 'seed-backup' | 'seed-confirm' | 'import';

// Wallet Onboarding Component (must be inside WdkProvider)
function WalletOnboarding() {
  const { setPin, unlock } = usePin();
  const { generateWallet, restoreWallet, seedPhrase } = useWdk();
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome');
  const [walletMode, setWalletMode] = useState<'create' | 'import' | null>(null);
  const [pendingSeedPhrase, setPendingSeedPhrase] = useState<string | null>(null);
  const [pendingPin, setPendingPin] = useState<string | null>(null);

  // Welcome Screen
  if (onboardingStep === 'welcome') {
    return (
      <WelcomeScreen
        onCreateWallet={() => {
          setWalletMode('create');
          setOnboardingStep('pin-setup');
        }}
        onImportWallet={() => {
          setWalletMode('import');
          setOnboardingStep('import');
        }}
      />
    );
  }

  // Import Wallet Screen
  if (onboardingStep === 'import' && walletMode === 'import') {
    return (
      <ImportWalletScreen
        onBack={() => {
          setOnboardingStep('welcome');
          setWalletMode(null);
        }}
        onImport={(seedPhrase) => {
          setPendingSeedPhrase(seedPhrase);
          setOnboardingStep('pin-setup');
        }}
      />
    );
  }

  // PIN Setup (for both create and import)
  if (onboardingStep === 'pin-setup') {
    return (
      <PinSetup
        onComplete={async (pin) => {
          setPendingPin(pin);
          
          if (walletMode === 'create') {
            // Generate wallet first
            await generateWallet();
            // Seed phrase will be available from WdkContext after generation
            // We'll get it in the next step
            setOnboardingStep('seed-backup');
          } else if (walletMode === 'import' && pendingSeedPhrase) {
            // Restore wallet with seed phrase
            await restoreWallet(pendingSeedPhrase);
            // Store seed phrase with PIN encryption
            await secureStorage.init();
            await secureStorage.storeSeedPhrase(pendingSeedPhrase, pin);
            // Set PIN (this will mark PIN as set)
            await setPin(pin);
            // Unlock wallet
            await unlock(pin);
            // Navigation will be handled by parent (will show dashboard)
          }
        }}
        isLoading={false}
      />
    );
  }

  // Seed Phrase Backup (only for create)
  if (onboardingStep === 'seed-backup' && seedPhrase) {
    return (
      <SeedPhraseBackup
        seedPhrase={seedPhrase}
        onBack={() => setOnboardingStep('pin-setup')}
        onContinue={() => setOnboardingStep('seed-confirm')}
      />
    );
  }

  // Seed Phrase Confirmation (only for create)
  if (onboardingStep === 'seed-confirm' && seedPhrase && pendingPin) {
    return (
      <SeedPhraseConfirmation
        seedPhrase={seedPhrase}
        onBack={() => setOnboardingStep('seed-backup')}
        onConfirm={async () => {
          // Store seed phrase with PIN encryption
          if (pendingPin && seedPhrase) {
            await secureStorage.init();
            await secureStorage.storeSeedPhrase(seedPhrase, pendingPin);
            // Set PIN (this will mark PIN as set)
            await setPin(pendingPin);
            // Unlock wallet
            await unlock(pendingPin);
            // Will navigate to dashboard (handled by parent)
          }
        }}
      />
    );
  }

  return null;
}

function AppContent() {
  const { isPinSet, isUnlocked, needsMigration, migrateLegacyWallet, isLoading } = usePin();
  const { isReady: wdkIsReady } = useWdk();
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');

  // Show loading while checking PIN status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-baifrost-teal text-lg">Loading...</div>
      </div>
    );
  }

  // Show migration flow if needed
  if (needsMigration) {
    return (
      <PinSetup
        onComplete={async (pin) => {
          await migrateLegacyWallet(pin);
        }}
        isLoading={isLoading}
      />
    );
  }

  // WdkProvider is now at App level, so all components share the same state
  return (
    <>
      {/* Show onboarding for first-time users */}
      {!isPinSet && <WalletOnboarding />}

      {/* Show unlock screen for returning users */}
      {isPinSet && !isUnlocked && <UnlockScreen />}

      {/* Show main app when unlocked - Dashboard will handle its own loading state */}
      {isPinSet && isUnlocked && (
        <>
          <AnimatePresence mode="wait">
            {currentScreen === 'dashboard' && (
              <Dashboard 
                key="dashboard" 
                onNavigate={(screen) => setCurrentScreen(screen)} 
              />
            )}
            {currentScreen === 'send' && (
              <SendScreen key="send" onBack={() => setCurrentScreen('dashboard')} />
            )}
            {currentScreen === 'swap' && (
              <SwapScreen key="swap" onBack={() => setCurrentScreen('dashboard')} />
            )}
            {currentScreen === 'receive' && (
              <ReceiveScreen key="receive" onBack={() => setCurrentScreen('dashboard')} />
            )}
          </AnimatePresence>
          
          {/* AI Agent Chat Widget - only show when wallet is ready */}
          {wdkIsReady && <AgentChatWidget />}
          
          {/* Transaction Approval Modal - shows when there's a pending transaction */}
          <TransactionApproval />
        </>
      )}
    </>
  );
}

function App() {
  return (
    <PinProvider>
      <WdkProvider>
        <AgentProvider>
          <AppContent />
        </AgentProvider>
      </WdkProvider>
    </PinProvider>
  );
}

export default App;
