import { useApp } from './state/AppContext';
import Home from './components/Home';
import Setup from './components/Setup';
import Game from './components/Game';
import History from './components/History';

export default function App() {
  const { screen, game } = useApp();

  return (
    <div className="app">
      {screen === 'home' && <Home />}
      {screen === 'setup' && <Setup />}
      {screen === 'game' && (game ? <Game /> : <Home />)}
      {screen === 'history' && <History />}
    </div>
  );
}
