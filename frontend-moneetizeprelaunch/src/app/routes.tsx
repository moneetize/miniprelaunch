import { createBrowserRouter } from "react-router";
import Root from "./Root";
import { SplashScreen } from "./pages/SplashScreen";
import { WelcomeScreen } from "./pages/WelcomeScreen";
import { AccountCreation } from "./pages/AccountCreation";
import { LoginScreen } from "./pages/LoginScreen";
import { AuthCallback } from "./pages/AuthCallback";
import { ForgotPassword } from "./pages/ForgotPassword";
import { WelcomeAI } from "./pages/WelcomeAI";
import { InfoSlideshow } from "./pages/InfoSlideshow";
import { OnboardingInterests } from "./pages/OnboardingInterests";
import { OnboardingInvestment } from "./pages/OnboardingInvestment";
import { OnboardingDashboard } from "./pages/OnboardingDashboard";
import { RewardsPage } from "./pages/RewardsPage";
import { DiscoveryHub } from "./pages/DiscoveryHub";
import { OnboardingComplete } from "./pages/OnboardingComplete";
import { SignupPage } from "./pages/SignupPage";
import { ActionsPage } from "./pages/ActionsPage";
import { CheckInPage } from "./pages/CheckInPage";
import { QuizPage } from "./pages/QuizPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ContentPage } from "./pages/ContentPage";
import { PortfolioPage } from "./pages/PortfolioPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { SurveysPage } from "./pages/SurveysPage";
import { PersonalizeName } from "./pages/PersonalizeName";
import { PersonalizePhoto } from "./pages/PersonalizePhoto";
import { PersonalizeReady } from "./pages/PersonalizeReady";
import { ProfileDashboard } from "./pages/ProfileDashboard";
import { ProfileScreen } from "./pages/ProfileScreen";
import { UserProfileView } from "./pages/UserProfileView";
import { SettingsScreen } from "./pages/SettingsScreen";
import { CreateTeam } from "./pages/CreateTeam";
import { InviteTeamMembers } from "./pages/InviteTeamMembers";
import { TeamView } from "./pages/TeamView";
import { GameplayScreen } from "./pages/GameplayScreen";
import WinningsScreen from "./pages/WinningsScreen";
import { DebugAuth } from "./pages/DebugAuth";
import { ShareInvites } from "./pages/ShareInvites";
import { GroupsPage } from "./pages/GroupsPage";
import { ScratchAndWin } from "./pages/ScratchAndWin";
import { ChatList } from "./pages/ChatList";
import { AgentChat } from "./pages/AgentChat";
import { UserChat } from "./pages/UserChat";
import { ProfileFeedsScreen } from "./pages/ProfileFeedsScreen";
import { AdminPanel } from "./pages/AdminPanel";
import { QRCodeScreen } from "./pages/QRCodeScreen";
import { ConnectionRequest } from "./pages/ConnectionRequest";
import { FollowListsPage } from "./pages/FollowListsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: AccountCreation },
      { path: "welcome", Component: WelcomeScreen },
      { path: "account-creation", Component: AccountCreation },
      { path: "login", Component: LoginScreen },
      { path: "auth/callback", Component: AuthCallback },
      { path: "forgot-password", Component: ForgotPassword },
      { path: "personalize-name", Component: PersonalizeName },
      { path: "personalize-photo", Component: PersonalizePhoto },
      { path: "personalize-ready", Component: PersonalizeReady },
      { path: "welcome-ai", Component: WelcomeAI },
      { path: "info-slideshow", Component: InfoSlideshow },
      { path: "onboarding-interests", Component: OnboardingInterests },
      { path: "onboarding-investment", Component: OnboardingInvestment },
      { path: "onboarding-dashboard", Component: OnboardingDashboard },
      { path: "rewards", Component: RewardsPage },
      { path: "discovery", Component: DiscoveryHub },
      { path: "onboarding-complete", Component: OnboardingComplete },
      { path: "signup", Component: SignupPage },
      { path: "actions", Component: ActionsPage },
      { path: "check-in", Component: CheckInPage },
      { path: "quiz", Component: QuizPage },
      { path: "products", Component: ProductsPage },
      { path: "content", Component: ContentPage },
      { path: "portfolio", Component: PortfolioPage },
      { path: "product/:productId", Component: ProductDetailPage },
      { path: "surveys", Component: SurveysPage },
      { path: "scratch-and-win", Component: ScratchAndWin },
      { path: "profile-dashboard", Component: ProfileDashboard },
      { path: "profile-screen", Component: ProfileScreen },
      { path: "profile", Component: ProfileScreen },
      { path: "user-profile", Component: UserProfileView },
      { path: "settings", Component: SettingsScreen },
      { path: "create-team", Component: CreateTeam },
      { path: "invite-team-members", Component: InviteTeamMembers },
      { path: "team-view", Component: TeamView },
      { path: "gameplay", Component: GameplayScreen },
      { path: "winnings", Component: WinningsScreen },
      { path: "share-invites", Component: ShareInvites },
      { path: "groups", Component: GroupsPage },
      { path: "debug-auth", Component: DebugAuth },
      { path: "chat-list", Component: ChatList },
      { path: "chat/agent", Component: AgentChat },
      { path: "chat/user/:id", Component: UserChat },
      { path: "chat/group/:id", Component: UserChat },
      { path: "chat/team/:id", Component: UserChat },
      { path: "profile-feeds", Component: ProfileFeedsScreen },
      { path: "admin-panel", Component: AdminPanel },
      { path: "qr-code", Component: QRCodeScreen },
      { path: "connection-request", Component: ConnectionRequest },
      { path: "follow-lists", Component: FollowListsPage },
    ],
  },
]);
