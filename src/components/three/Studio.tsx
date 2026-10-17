import { Environment, Lightformer } from "@react-three/drei";

/* Iluminação de estúdio procedural (sem baixar HDR): faixas de luz brancas e
 * violetas que geram os reflexos no titânio, no vidro e na pintura. */
export default function Studio({ warm = false, intensity = 1 }: { warm?: boolean; intensity?: number }) {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={["#0a0614"]} />
      <Lightformer form="rect" intensity={3 * intensity} color="#ffffff" position={[0, 5, -2]} rotation-x={Math.PI / 2} scale={[10, 2, 1]} />
      <Lightformer form="rect" intensity={2.2 * intensity} color="#c4b5fd" position={[-5, 1.5, 1]} rotation-y={Math.PI / 2} scale={[6, 1.2, 1]} />
      <Lightformer form="rect" intensity={2.2 * intensity} color="#8b5cf6" position={[5, 1, -1]} rotation-y={-Math.PI / 2} scale={[6, 1.5, 1]} />
      <Lightformer form="rect" intensity={1.6 * intensity} color={warm ? "#ffb070" : "#ffffff"} position={[0, 1, 6]} scale={[8, 1, 1]} />
      <Lightformer form="ring" intensity={2 * intensity} color="#a78bfa" position={[2, 3, 4]} scale={2.5} />
    </Environment>
  );
}
