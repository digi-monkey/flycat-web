interface ContainerProps {
  children: React.ReactNode;
}

const Container: React.FC<ContainerProps> = ({ children }) => {
  return (
    <div className="flex justify-center min-h-screen">
      <div className="container font-body grid grid-cols-12">{children}</div>
    </div>
  );
};
export default Container;
