import * as Avatar from '@radix-ui/react-avatar';

function AvatarProfile({
  src,
  alt,
  fallback,
}: {
  src?: string;
  alt?: string;
  fallback?: string;
}) {
  return (
    <Avatar.Root className="flex justify-center items-center w-11 h-11 bg-gray-200 rounded-full overflow-hidden">
      <Avatar.Image src={src} alt={alt} className="w-full h-full" />
      <Avatar.Fallback className="text-lg font-medium uppercase text-gray-400">
        {fallback}
      </Avatar.Fallback>
    </Avatar.Root>
  );
}

export default AvatarProfile;
