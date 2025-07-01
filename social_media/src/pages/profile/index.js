import React, { useEffect } from 'react';
import Main from '../../components/profile/Main';
import Navbar from '../../components/navbar/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import FooterNav from '../../components/footer/FooterNav';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_USER_INFO } from '../../graphql/mutations';
import ProfileHeader from '../../components/profile/ProfileHeader';
import UserInfo from '../../components/profile/UserInfo';
import Tabs from '../../components/profile/Tabs';
import PhotoGrid from '../../components/profile/PhotoGrid';

const ProfilePage = () => {
   const token = sessionStorage.getItem('user');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [navigate, token]);

  return (
    <div className="w-full relative">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <div className="flex-1 md:ml-64 relative">
          <div className="max-w-4xl mx-auto px-4">
            {/* Footer */}
            <div className="mb-4">
              <FooterNav />
            </div>
            <div className="flex justify-center">
              <Main />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export function UserProfilePage() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(GET_USER_INFO, { variables: { id } });
  console.log('UserProfilePage id:', id);
  console.log('UserProfilePage data:', data);
  console.log('UserProfilePage error:', error);
  if (loading) return <div>Loading...</div>;
  if (error || !data?.getUserInformation) return <div>User not found</div>;
  const user = data.getUserInformation;
  const profile = {
    id: user.id,
    name: user.name,
    avatar: user.profileImage,
    bio: user.bio,
    stats: {
      followers: user.followers?.length || 0,
      following: user.following?.length || 0,
      posts: user.posts?.length || 0,
    },
  };
  return (
    <div className="w-full relative">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <div className="flex-1 md:ml-64 relative">
          <div className="max-w-4xl mx-auto px-4">
            <div className="mb-4">
              <FooterNav />
            </div>
            <div className="flex justify-center">
              <ProfileHeader profile={profile} updateProfile={() => {}} />
            </div>
            <div className="flex justify-center">
              <UserInfo profile={profile} setProfile={() => {}} isFollowed={false} setIsFollowed={() => {}} />
            </div>
            {/* Add Tabs, PhotoGrid, etc. as needed */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage; 