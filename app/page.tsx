import GameCanvas from "@/components/game/GameCanvas";
import ScorePanel from "@/components/ui/ScorePanel";
import SettingsMenu from "@/components/ui/SettingsMenu";
import TurnIndicator from "@/components/ui/TurnIndicator";
import WinScreen from "@/components/ui/WinScreen";

export default function Home() {
  return (
    <main className="relative flex-1 overflow-hidden bg-black">
      <GameCanvas />
      <ScorePanel />
      <SettingsMenu />
      <TurnIndicator />
      <WinScreen />
    </main>
  );
}
