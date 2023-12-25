import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from 'components/shared/ui/Drawer';
import { EventSetMetadataContent } from 'core/nostr/type';
import { FiMenu, FiX } from 'react-icons/fi';
import { Profile } from './profile';

export type UserDrawerProps = {
  user?: EventSetMetadataContent;
};

export function UserDrawer(props: UserDrawerProps) {
  const { user } = props;
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <div className="sm:hidden flex items-center">
          <FiMenu className="w-7 h-7 fill-gray-700" />
        </div>
      </DrawerTrigger>
      <DrawerContent className="h-screen bg-surface-02 rounded-none">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex justify-end items-center">
            <DrawerClose asChild>
              <FiX className="w-7 h-7 fill-gray-700" />
            </DrawerClose>
          </div>
          <DrawerHeader>
            <DrawerTitle>
              <Profile user={user} className="justify-start" showName />
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div className="flex items-center justify-center space-x-2">
              <span className="sr-only">Decrease</span>
            </div>
          </div>
          <DrawerFooter>Submit</DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
