import { Badge, Card } from "react-bootstrap";
import { IAttachment } from "../types/order";
import classNames from "classnames";
import pdfImage from "./pdf-file.png";


interface MediaComponentProps {
  media: IAttachment;
}

const Attachment: React.FC<MediaComponentProps> = ({ media }) => {
  const labelClass = classNames("", {
    "success": media.status === "Accepted",
    "info": media.status === "Pending",
    "danger": media.status === "Closed" || media.status === "Rejected"
  });

  return (
    <Card style={{ width: '12rem' }} className="attachment float-left">
      {media.ext === "pdf"? (<Card.Img variant="top" src={pdfImage} width={100} height={180}/>):(<Card.Img variant="top" src={media.url} width={100} height={180}/>)}
      <Card.Body>
        <Card.Title>{media.name}</Card.Title>
        <Card.Text>
          <p><strong>Status:</strong> <Badge bg={labelClass}>{media.status}</Badge></p>
          <p><small>Updated On: {new Date(media.updated).toLocaleString()}</small></p>
        </Card.Text>
        {/* {media.status === "Pending" && (
          <>
            <Button variant="success" onClick={(e) => handleStatus("Accepted")} size="sm" className="rounded-0">Accept</Button>
            <Button variant="danger" onClick={(e) => handleStatus("Rejected")} size="sm" className="rounded-0">Reject</Button>
          </>
        )} */}
      </Card.Body>
    </Card>
  );
};

export default Attachment;